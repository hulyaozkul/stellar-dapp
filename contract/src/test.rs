use soroban_sdk::{symbol_short, Env};

use crate::{IncrementContract, IncrementContractClient};

#[test]
fn test_increment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, IncrementContract);
    let client = IncrementContractClient::new(&env, &contract_id);
    assert_eq!(client.get(), 0);
    assert_eq!(client.increment(), 1);
    assert_eq!(client.increment(), 2);
    assert_eq!(client.get(), 2);
}
