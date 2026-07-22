use std::io::{self, Read};
use ut_tdd_resource_kernel_companion::{HandshakeRequest, ResourceKernel, UnsupportedAdapter};

fn main() {
    let mut input = String::new();
    if io::stdin().read_to_string(&mut input).is_err() {
        std::process::exit(2);
    }

    let request = match serde_json::from_str::<HandshakeRequest>(&input) {
        Ok(request) => request,
        Err(_) => std::process::exit(2),
    };
    let response = ResourceKernel::new(UnsupportedAdapter).handshake(&request);
    match serde_json::to_string(&response) {
        Ok(json) => println!("{json}"),
        Err(_) => std::process::exit(2),
    }

    if !response.accepted {
        std::process::exit(3);
    }
}
