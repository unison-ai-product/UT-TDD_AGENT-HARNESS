use std::io::{self, Read, Write};
use ut_tdd_resource_kernel_companion::{
    CompanionCommand, CompanionResponse, ResourceKernel, UnsupportedAdapter, MAX_COMMAND_BYTES,
};

fn read_command() -> Result<CompanionCommand, ()> {
    let mut stdin = io::stdin().lock();
    let mut length_bytes = [0_u8; 4];
    stdin.read_exact(&mut length_bytes).map_err(|_| ())?;
    let length = u32::from_be_bytes(length_bytes) as usize;
    if length > MAX_COMMAND_BYTES {
        return Err(());
    }
    let mut payload = vec![0_u8; length];
    stdin.read_exact(&mut payload).map_err(|_| ())?;
    let mut trailing = [0_u8; 1];
    if stdin.read(&mut trailing).map_err(|_| ())? != 0 {
        return Err(());
    }
    serde_json::from_slice(&payload).map_err(|_| ())
}

fn write_response(response: &CompanionResponse) -> Result<(), ()> {
    let payload = serde_json::to_vec(response).map_err(|_| ())?;
    let length = u32::try_from(payload.len()).map_err(|_| ())?;
    let mut stdout = io::stdout().lock();
    stdout.write_all(&length.to_be_bytes()).map_err(|_| ())?;
    stdout.write_all(&payload).map_err(|_| ())?;
    stdout.flush().map_err(|_| ())
}

fn main() {
    let command = match read_command() {
        Ok(command) => command,
        Err(_) => std::process::exit(2),
    };
    let response = ResourceKernel::new(UnsupportedAdapter).execute_command(command);
    let rejected = matches!(
        &response,
        CompanionResponse::ExecutionAdmission {
            accepted: false,
            ..
        }
    );
    if write_response(&response).is_err() {
        std::process::exit(2);
    }

    if rejected {
        std::process::exit(3);
    }
}
