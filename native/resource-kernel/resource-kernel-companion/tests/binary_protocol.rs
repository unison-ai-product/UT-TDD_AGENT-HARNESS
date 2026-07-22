use serde_json::Value;
use std::io::Write;
use std::process::{Command, Output, Stdio};
use ut_tdd_resource_kernel_companion::{MAX_COMMAND_BYTES, PROTOCOL_VERSION};

fn run(input: &[u8]) -> Output {
    let mut child = Command::new(env!("CARGO_BIN_EXE_ut-tdd-resource-kernel-companion"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("companion binary must start");
    child.stdin.take().unwrap().write_all(input).unwrap();
    child.wait_with_output().unwrap()
}

fn frame(payload: &[u8]) -> Vec<u8> {
    let mut frame = Vec::with_capacity(4 + payload.len());
    frame.extend_from_slice(&(payload.len() as u32).to_be_bytes());
    frame.extend_from_slice(payload);
    frame
}

fn response_payload(output: &Output) -> &[u8] {
    assert!(output.stdout.len() >= 4);
    let length = u32::from_be_bytes(output.stdout[..4].try_into().unwrap()) as usize;
    assert_eq!(output.stdout.len(), length + 4);
    &output.stdout[4..]
}

#[test]
fn execution_admission_requires_minimum_custody_and_has_one_json_frame() {
    let output = run(&frame(
        br#"{"command":"admit_execution","admission":{"protocol_version":1,"required_capabilities":[],"token":{"attempt_id":"a1","nonce":"n1","probe_digest":"sha256:p"}}}"#,
    ));

    assert_eq!(output.status.code(), Some(3));
    assert!(output.stderr.is_empty());
    let response: Value = serde_json::from_slice(response_payload(&output)).unwrap();
    assert_eq!(response["response"], "execution_admission");
    assert_eq!(response["accepted"], false);
    assert_eq!(response["failure"]["process_created"], false);
    assert_eq!(
        response["failure"]["missing_capabilities"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
}

#[test]
fn capability_query_is_not_an_execution_acceptance() {
    let output = run(&frame(
        format!(r#"{{"command":"probe","protocol_version":{PROTOCOL_VERSION}}}"#).as_bytes(),
    ));

    assert_eq!(output.status.code(), Some(0));
    let response: Value = serde_json::from_slice(response_payload(&output)).unwrap();
    assert_eq!(response["response"], "probe");
    assert!(response.get("accepted").is_none());
}

#[test]
fn malformed_unknown_partial_and_trailing_commands_fail_closed() {
    for payload in [
        br#"{"command":"unknown","protocol_version":1}"#.as_slice(),
        br#"{"command":"admit_execution"#.as_slice(),
        br#"{"command":"probe","protocol_version":1} trailing"#.as_slice(),
        br#"{"command":"probe","protocol_version":1,"unknown":true}"#.as_slice(),
        br#"{"command":"admit_execution","admission":{"protocol_version":1,"required_capabilities":[]}}"#.as_slice(),
        br#"{"command":"admit_execution","admission":{"protocol_version":1,"required_capabilities":["unknown_capability"],"token":{"attempt_id":"a1","nonce":"n1","probe_digest":"sha256:p"}}}"#.as_slice(),
        &[0xff, 0xfe][..],
    ] {
        let output = run(&frame(payload));
        assert_eq!(output.status.code(), Some(2));
        assert!(output.stdout.is_empty());
        assert!(output.stderr.is_empty());
    }
}

#[test]
fn oversized_command_fails_without_output() {
    let output = run(&frame(&vec![b' '; MAX_COMMAND_BYTES + 1]));
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty());
    assert!(output.stderr.is_empty());
}

#[test]
fn partial_and_trailing_frames_fail_without_output() {
    let mut partial = (8_u32).to_be_bytes().to_vec();
    partial.extend_from_slice(b"{}");
    for input in [
        partial,
        [
            frame(br#"{"command":"probe","protocol_version":1}"#),
            vec![0],
        ]
        .concat(),
    ] {
        let output = run(&input);
        assert_eq!(output.status.code(), Some(2));
        assert!(output.stdout.is_empty());
        assert!(output.stderr.is_empty());
    }
}
