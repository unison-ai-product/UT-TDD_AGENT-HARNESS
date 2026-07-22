use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

pub const PROTOCOL_VERSION: u16 = 1;
pub const MAX_COMMAND_BYTES: usize = 64 * 1024;

pub fn execution_custody_capabilities() -> BTreeSet<Capability> {
    BTreeSet::from([
        Capability::AtomicAttachBeforeUserCode,
        Capability::TreeKill,
        Capability::TreeEmptyProof,
    ])
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(tag = "command", rename_all = "snake_case", deny_unknown_fields)]
pub enum CompanionCommand {
    Probe { protocol_version: u16 },
    AdmitExecution { admission: ExecutionAdmission },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExecutionAdmission {
    pub protocol_version: u16,
    #[serde(default)]
    pub required_capabilities: BTreeSet<Capability>,
    pub token: AdmissionToken,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AdmissionToken {
    pub attempt_id: String,
    pub nonce: String,
    pub probe_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "response", rename_all = "snake_case")]
pub enum CompanionResponse {
    Probe {
        protocol_version: u16,
        adapter: String,
        available_capabilities: BTreeSet<Capability>,
    },
    ExecutionAdmission {
        protocol_version: u16,
        adapter: String,
        available_capabilities: BTreeSet<Capability>,
        accepted: bool,
        failure: Option<PreLaunchFailure>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Capability {
    AtomicAttachBeforeUserCode,
    TreeKill,
    TreeEmptyProof,
    CrashSurvivingCustodian,
    NonInheritableCustodyHandle,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct HandshakeRequest {
    pub protocol_version: u16,
    pub required_capabilities: BTreeSet<Capability>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct HandshakeResponse {
    pub protocol_version: u16,
    pub adapter: String,
    pub available_capabilities: BTreeSet<Capability>,
    pub accepted: bool,
    pub failure: Option<PreLaunchFailure>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PreLaunchFailureKind {
    ProtocolMismatch,
    CapabilityUnavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PreLaunchFailure {
    pub kind: PreLaunchFailureKind,
    pub missing_capabilities: BTreeSet<Capability>,
    pub process_created: bool,
}

pub trait OsAdapter {
    fn name(&self) -> &'static str;
    fn capabilities(&self) -> BTreeSet<Capability>;
}

pub trait ProcessLauncher {
    type Output;

    fn launch(&mut self) -> Self::Output;
}

pub struct UnsupportedAdapter;

impl OsAdapter for UnsupportedAdapter {
    fn name(&self) -> &'static str {
        "unsupported"
    }

    fn capabilities(&self) -> BTreeSet<Capability> {
        BTreeSet::new()
    }
}

pub struct ResourceKernel<A> {
    adapter: A,
}

impl<A: OsAdapter> ResourceKernel<A> {
    pub fn new(adapter: A) -> Self {
        Self { adapter }
    }

    pub fn handshake(&self, request: &HandshakeRequest) -> HandshakeResponse {
        let available = self.adapter.capabilities();
        let failure = if request.protocol_version != PROTOCOL_VERSION {
            Some(PreLaunchFailure {
                kind: PreLaunchFailureKind::ProtocolMismatch,
                missing_capabilities: BTreeSet::new(),
                process_created: false,
            })
        } else {
            let missing = request
                .required_capabilities
                .difference(&available)
                .cloned()
                .collect::<BTreeSet<_>>();
            (!missing.is_empty()).then_some(PreLaunchFailure {
                kind: PreLaunchFailureKind::CapabilityUnavailable,
                missing_capabilities: missing,
                process_created: false,
            })
        };

        HandshakeResponse {
            protocol_version: PROTOCOL_VERSION,
            adapter: self.adapter.name().to_owned(),
            available_capabilities: available,
            accepted: failure.is_none(),
            failure,
        }
    }

    pub fn execute_command(&self, command: CompanionCommand) -> CompanionResponse {
        match command {
            CompanionCommand::Probe {
                protocol_version: _,
            } => CompanionResponse::Probe {
                protocol_version: PROTOCOL_VERSION,
                adapter: self.adapter.name().to_owned(),
                available_capabilities: self.adapter.capabilities(),
            },
            CompanionCommand::AdmitExecution { mut admission } => {
                admission
                    .required_capabilities
                    .extend(execution_custody_capabilities());
                let admission = self.handshake(&HandshakeRequest {
                    protocol_version: admission.protocol_version,
                    required_capabilities: admission.required_capabilities,
                });
                CompanionResponse::ExecutionAdmission {
                    protocol_version: admission.protocol_version,
                    adapter: admission.adapter,
                    available_capabilities: admission.available_capabilities,
                    accepted: admission.accepted,
                    failure: admission.failure,
                }
            }
        }
    }

    pub fn launch<L: ProcessLauncher>(
        &self,
        request: &HandshakeRequest,
        launcher: &mut L,
    ) -> Result<L::Output, PreLaunchFailure> {
        let mut execution_request = request.clone();
        execution_request
            .required_capabilities
            .extend(execution_custody_capabilities());
        match self.handshake(&execution_request).failure {
            Some(failure) => Err(failure),
            None => Ok(launcher.launch()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct CountingLauncher {
        calls: usize,
    }

    impl ProcessLauncher for CountingLauncher {
        type Output = ();

        fn launch(&mut self) {
            self.calls += 1;
        }
    }

    fn hard_custody_request() -> HandshakeRequest {
        HandshakeRequest {
            protocol_version: PROTOCOL_VERSION,
            required_capabilities: BTreeSet::from([
                Capability::AtomicAttachBeforeUserCode,
                Capability::TreeKill,
                Capability::TreeEmptyProof,
            ]),
        }
    }

    #[test]
    fn unsupported_adapter_fails_before_process_creation() {
        let kernel = ResourceKernel::new(UnsupportedAdapter);
        let mut launcher = CountingLauncher { calls: 0 };

        let failure = kernel
            .launch(&hard_custody_request(), &mut launcher)
            .expect_err("hard custody must not silently downgrade");

        assert_eq!(failure.kind, PreLaunchFailureKind::CapabilityUnavailable);
        assert!(!failure.process_created);
        assert_eq!(launcher.calls, 0);
    }

    #[test]
    fn protocol_mismatch_fails_before_capability_or_process_work() {
        let kernel = ResourceKernel::new(UnsupportedAdapter);
        let mut launcher = CountingLauncher { calls: 0 };
        let mut request = hard_custody_request();
        request.protocol_version = PROTOCOL_VERSION + 1;

        let failure = kernel.launch(&request, &mut launcher).unwrap_err();

        assert_eq!(failure.kind, PreLaunchFailureKind::ProtocolMismatch);
        assert!(!failure.process_created);
        assert!(failure.missing_capabilities.is_empty());
        assert_eq!(launcher.calls, 0);
    }

    #[test]
    fn handshake_is_versioned_json_without_custody_claims() {
        let response = ResourceKernel::new(UnsupportedAdapter).handshake(&hard_custody_request());
        let json = serde_json::to_value(response).unwrap();

        assert_eq!(json["protocol_version"], PROTOCOL_VERSION);
        assert_eq!(json["adapter"], "unsupported");
        assert_eq!(json["accepted"], false);
        assert_eq!(json["failure"]["process_created"], false);
        assert_eq!(json["available_capabilities"], serde_json::json!([]));
    }

    #[test]
    fn request_rejects_unknown_protocol_fields() {
        let input =
            r#"{"protocol_version":1,"required_capabilities":[],"program":"must-not-launch"}"#;

        assert!(serde_json::from_str::<HandshakeRequest>(input).is_err());
    }

    #[test]
    fn launch_cannot_omit_the_minimum_custody_contract() {
        let kernel = ResourceKernel::new(UnsupportedAdapter);
        let mut launcher = CountingLauncher { calls: 0 };
        let request = HandshakeRequest {
            protocol_version: PROTOCOL_VERSION,
            required_capabilities: BTreeSet::new(),
        };

        let failure = kernel.launch(&request, &mut launcher).unwrap_err();

        assert_eq!(failure.kind, PreLaunchFailureKind::CapabilityUnavailable);
        assert_eq!(
            failure.missing_capabilities,
            execution_custody_capabilities()
        );
        assert_eq!(launcher.calls, 0);
    }

    #[test]
    fn execution_command_cannot_turn_empty_capabilities_into_acceptance() {
        let response = ResourceKernel::new(UnsupportedAdapter).execute_command(
            CompanionCommand::AdmitExecution {
                admission: ExecutionAdmission {
                    protocol_version: PROTOCOL_VERSION,
                    required_capabilities: BTreeSet::new(),
                    token: AdmissionToken {
                        attempt_id: "attempt-1".to_owned(),
                        nonce: "nonce-1".to_owned(),
                        probe_digest: "sha256:probe".to_owned(),
                    },
                },
            },
        );

        let CompanionResponse::ExecutionAdmission {
            accepted, failure, ..
        } = response
        else {
            panic!("execution command must return an admission response");
        };
        assert!(!accepted);
        assert_eq!(
            failure.unwrap().missing_capabilities,
            execution_custody_capabilities()
        );
    }
}
