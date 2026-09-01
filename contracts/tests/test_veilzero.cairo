use snforge_std::{ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address};
use starknet::ContractAddress;
use veilzero_protocol::{IVeilZeroDispatcher, IVeilZeroDispatcherTrait};

#[starknet::interface]
trait IMockToken<TState> {
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::contract]
mod MockToken {
    use starknet::ContractAddress;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MockTokenImpl of super::IMockToken<ContractState> {
        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let _ = (sender, recipient, amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let _ = (spender, amount);
            true
        }
    }
}

fn address(value: felt252) -> ContractAddress {
    value.try_into().unwrap()
}

fn deploy_protocol() -> (IVeilZeroDispatcher, ContractAddress, ContractAddress, ContractAddress) {
    let pool = address(111);
    let token_class = declare("MockToken").unwrap().contract_class();
    let (token, _) = token_class.deploy(@array![]).unwrap();
    let protocol_class = declare("VeilZero").unwrap().contract_class();
    let (contract_address, _) = protocol_class.deploy(@array![pool.into()]).unwrap();
    (IVeilZeroDispatcher { contract_address }, contract_address, pool, token)
}

fn create_program(
    dispatcher: IVeilZeroDispatcher,
    contract_address: ContractAddress,
    admin: ContractAddress,
    token: ContractAddress,
    program_id: felt252,
) {
    start_cheat_caller_address(contract_address, admin);
    dispatcher.create_program(program_id, 101, 102, 100, 200, token, 10, 20, 30);
}

fn submit_case(
    dispatcher: IVeilZeroDispatcher,
    contract_address: ContractAddress,
    pool: ContractAddress,
    program_id: felt252,
    case_id: felt252,
) {
    start_cheat_caller_address(contract_address, pool);
    let deposits = dispatcher.privacy_invoke(0, program_id, case_id, 201, 202, 128, 203, 0, 0);
    assert(deposits.len() == 0, 'unexpected deposit');
}

#[test]
fn program_and_case_happy_path() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    assert(dispatcher.get_case_status(1, 7) == 1, 'submitted status');
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    assert(dispatcher.get_case_status(1, 7) == 3, 'accepted status');
}

#[test]
fn case_ids_are_bound_to_programs() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    create_program(dispatcher, contract_address, admin, token, 2);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    submit_case(dispatcher, contract_address, pool, 2, 7);
    assert(dispatcher.get_case_status(1, 7) == 1, 'program one status');
    assert(dispatcher.get_case_status(2, 7) == 1, 'program two status');
}

#[test]
#[should_panic(expected: 'PROGRAM_EXISTS')]
fn duplicate_program_is_rejected() {
    let (dispatcher, contract_address, _, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    create_program(dispatcher, contract_address, admin, token, 1);
}

#[test]
#[should_panic(expected: 'CASE_EXISTS')]
fn duplicate_case_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    submit_case(dispatcher, contract_address, pool, 1, 7);
}

#[test]
#[should_panic(expected: 'ONLY_POOL')]
fn privacy_action_rejects_non_pool_caller() {
    let (dispatcher, contract_address, _, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 128, 203, 0, 0);
}

#[test]
#[should_panic(expected: 'ONLY_ADMIN')]
fn lifecycle_rejects_non_admin() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, address(333));
    dispatcher.acknowledge(1, 7);
}

#[test]
#[should_panic(expected: 'EMPTY_PAYLOAD')]
fn empty_payload_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 0, 203, 0, 0);
}

#[test]
#[should_panic(expected: 'PAYLOAD_TOO_LARGE')]
fn oversized_payload_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 16385, 203, 0, 0);
}

#[test]
fn reserve_backed_claim_returns_one_note_and_debits_reserve() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, 555, 1000);
    start_cheat_caller_address(contract_address, pool);
    let deposits = dispatcher.privacy_invoke(2, 1, 7, 0, 0, 0, 0, 555, 777);
    assert(deposits.len() == 1, 'one note');
    let deposit = *deposits.at(0);
    assert(deposit.amount == 20, 'tier amount');
    assert(deposit.note_id == 777, 'note id');
    assert(dispatcher.get_reserve(1) == 80, 'reserve debit');
    assert(dispatcher.get_case_status(1, 7) == 5, 'settled status');
}

#[test]
#[should_panic(expected: 'INVALID_STATUS')]
fn duplicate_settlement_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, 555, 1000);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(2, 1, 7, 0, 0, 0, 0, 555, 777);
    dispatcher.privacy_invoke(2, 1, 7, 0, 0, 0, 0, 555, 778);
}

#[test]
#[should_panic(expected: 'BAD_NULLIFIER')]
fn wrong_nullifier_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 1, 555, 1000);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(2, 1, 7, 0, 0, 0, 0, 556, 777);
}
