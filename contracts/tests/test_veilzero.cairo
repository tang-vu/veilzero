use core::poseidon::poseidon_hash_span;
use snforge_std::signature::SignerTrait;
use snforge_std::signature::stark_curve::{
    StarkCurveKeyPair, StarkCurveKeyPairImpl, StarkCurveSignerImpl,
};
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, EventSpyTrait, declare, spy_events,
    start_cheat_block_timestamp, start_cheat_caller_address, start_cheat_transaction_version,
};
use starknet::ContractAddress;
use veilzero_protocol::{IVeilZeroDispatcher, IVeilZeroDispatcherTrait};

const NOTE_MARKER_BEFORE: felt252 = 'VZ_NOTE_BEGIN_V1';
const NOTE_MARKER_AFTER: felt252 = 'VZ_NOTE_END_V1';
const ESTIMATION_VERSION: felt252 = 0x100000000000000000000000000000003;

#[starknet::interface]
trait IMockToken<TState> {
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
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

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let _ = (recipient, amount);
            true
        }
    }
}

fn address(value: felt252) -> ContractAddress {
    value.try_into().unwrap()
}

fn researcher_key() -> StarkCurveKeyPair {
    StarkCurveKeyPairImpl::from_secret_key(123456789)
}

fn make_claim_commitment(program_id: felt252, case_id: felt252, secret: felt252) -> felt252 {
    poseidon_hash_span(array!['VZ_CLAIM_AUTH_V1', program_id, case_id, secret].span())
}

fn make_claim_hash(
    program_id: felt252, case_id: felt252, secret: felt252, note_id: felt252,
) -> felt252 {
    poseidon_hash_span(array!['VZ_CLAIM_MSG_V1', program_id, case_id, secret, note_id].span())
}

fn make_clarification_hash(
    program_id: felt252,
    case_id: felt252,
    report_commitment: felt252,
    ciphertext_hash: felt252,
    payload_size: u32,
) -> felt252 {
    poseidon_hash_span(
        array![
            'VZ_CLARIFY_V1', program_id, case_id, report_commitment, ciphertext_hash,
            payload_size.into(),
        ]
            .span(),
    )
}

#[test]
fn authorization_hashes_match_typescript_vectors() {
    assert(
        make_clarification_hash(
            1, 7, 301, 302, 64,
        ) == 0x5160196209902f9ff5b3ecf87f825d7ea7a2049eca2951929bf3de739f6a44e,
        'clarify vector',
    );
    assert(
        make_claim_commitment(
            1, 7, 555,
        ) == 0x561121f44a415b147c11d0370d7ea6c776d6459d2dc6811052852769fd54d1,
        'claim auth vector',
    );
    assert(
        make_claim_hash(
            1, 7, 555, 777,
        ) == 0x4a818bb93218433c6c8e1344ba4fd01db70448da1ba03223302dbe8451bf4ae,
        'claim message vector',
    );
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
    let deposits = dispatcher
        .privacy_invoke(
            0, program_id, case_id, 201, 202, 128, researcher_key().public_key, 0, 0, 0, 0,
        );
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
    dispatcher.request_clarification(1, 7, 909);
    dispatcher.decide(1, 7, true);
    assert(dispatcher.get_case_status(1, 7) == 3, 'accepted status');
    let program = dispatcher.get_program(1);
    assert(program.active, 'program active');
    assert(program.acknowledgement_sla == 100, 'ack sla');
    assert(program.remediation_sla == 200, 'remediation sla');
    assert(program.tier_2 == 20, 'tier two');
    let case = dispatcher.get_case(1, 7);
    assert(case.status == 3, 'case view status');
    assert(case.report_commitment == 201, 'case report');
    assert(case.ciphertext_hash == 202, 'case ciphertext');
    assert(case.payload_size == 128, 'case size');
    assert(case.remediation_deadline == 200, 'remediation deadline');
}

#[test]
#[should_panic(expected: 'ONLY_ADMIN')]
fn clarification_request_rejects_non_admin() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, address(333));
    dispatcher.request_clarification(1, 7, 909);
}

#[test]
#[should_panic(expected: 'ZERO_COMMITMENT')]
fn clarification_request_rejects_empty_commitment() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.request_clarification(1, 7, 0);
}

#[test]
#[should_panic(expected: 'PROGRAM_PAUSED')]
fn paused_program_rejects_new_cases() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.set_program_active(1, false);
    submit_case(dispatcher, contract_address, pool, 1, 7);
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
#[should_panic(expected: 'INVALID_CONFIG')]
fn invalid_program_configuration_is_rejected() {
    let (dispatcher, contract_address, _, token) = deploy_protocol();
    start_cheat_caller_address(contract_address, address(222));
    dispatcher.create_program(0, 101, 102, 100, 200, token, 10, 20, 30);
}

#[test]
fn program_creation_emits_expected_event() {
    let (dispatcher, contract_address, _, token) = deploy_protocol();
    let mut spy = spy_events();
    create_program(dispatcher, contract_address, address(222), token, 1);
    let events = spy.get_events();
    assert(events.events.len() == 1, 'unexpected event count');
    let (emitter, event) = events.events.at(0);
    assert(emitter == @contract_address, 'wrong event emitter');
    assert(event.keys.at(0) == @selector!("ProgramCreated"), 'wrong event selector');
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
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 128, 203, 0, 0, 0, 0);
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
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 0, 203, 0, 0, 0, 0);
}

#[test]
#[should_panic(expected: 'PAYLOAD_TOO_LARGE')]
fn oversized_payload_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 16401, 203, 0, 0, 0, 0);
}

#[test]
fn authorization_locks_reserve_and_claim_spends_the_case_lock() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 20);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    assert(dispatcher.get_reserve(1) == 0, 'reserve locked');
    assert(dispatcher.get_case(1, 7).reward_amount == 20, 'case lock');
    start_cheat_caller_address(contract_address, pool);
    let (r, s) = researcher_key().sign(make_claim_hash(1, 7, 555, 777)).unwrap();
    let deposits = dispatcher
        .privacy_invoke(2, 1, 7, r, s, 0, 0, 555, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
    assert(deposits.len() == 1, 'one note');
    let deposit = *deposits.at(0);
    assert(deposit.amount == 20, 'tier amount');
    assert(deposit.note_id == 777, 'note id');
    assert(dispatcher.get_reserve(1) == 0, 'no double debit');
    assert(dispatcher.get_case_status(1, 7) == 5, 'settled status');
}

#[test]
#[should_panic(expected: 'INSUFFICIENT_RESERVE')]
fn reward_authorizations_cannot_overcommit_one_reserve() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 50);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    submit_case(dispatcher, contract_address, pool, 1, 8);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 3, make_claim_commitment(1, 7, 555), 1000);
    assert(dispatcher.get_reserve(1) == 20, 'first lock');
    dispatcher.acknowledge(1, 8);
    dispatcher.decide(1, 8, true);
    dispatcher.authorize_reward(1, 8, 3, make_claim_commitment(1, 8, 556), 1000);
}

#[test]
fn expired_reward_lock_can_be_released_and_reauthorized() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    assert(dispatcher.get_reserve(1) == 80, 'locked reserve');
    start_cheat_block_timestamp(contract_address, 1001);
    dispatcher.release_expired_reward(1, 7);
    assert(dispatcher.get_reserve(1) == 100, 'released reserve');
    assert(dispatcher.get_case_status(1, 7) == 3, 'accepted again');
    assert(dispatcher.get_case(1, 7).reward_amount == 0, 'lock cleared');
    dispatcher.authorize_reward(1, 7, 1, make_claim_commitment(1, 7, 556), 2000);
    assert(dispatcher.get_reserve(1) == 90, 'reauthorized lock');
}

#[test]
#[should_panic(expected: 'AUTH_NOT_EXPIRED')]
fn active_reward_lock_cannot_be_released() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    dispatcher.release_expired_reward(1, 7);
}

#[test]
fn paused_program_withdraws_only_available_reserve() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 3, make_claim_commitment(1, 7, 555), 1000);
    assert(dispatcher.get_reserve(1) == 70, 'available after lock');
    dispatcher.set_program_active(1, false);
    dispatcher.withdraw_available_reserve(1, 70);
    assert(dispatcher.get_reserve(1) == 0, 'available withdrawn');
    assert(dispatcher.get_case(1, 7).reward_amount == 30, 'case lock protected');
}

#[test]
#[should_panic(expected: 'PROGRAM_ACTIVE')]
fn active_program_cannot_withdraw_reserve() {
    let (dispatcher, contract_address, _, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    dispatcher.withdraw_available_reserve(1, 10);
}

#[test]
#[should_panic(expected: 'INSUFFICIENT_RESERVE')]
fn withdrawal_cannot_consume_case_locked_amount() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 30);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 3, make_claim_commitment(1, 7, 555), 1000);
    dispatcher.set_program_active(1, false);
    dispatcher.withdraw_available_reserve(1, 1);
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
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    start_cheat_caller_address(contract_address, pool);
    let (r, s) = researcher_key().sign(make_claim_hash(1, 7, 555, 777)).unwrap();
    dispatcher.privacy_invoke(2, 1, 7, r, s, 0, 0, 555, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
    dispatcher.privacy_invoke(2, 1, 7, r, s, 0, 0, 555, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
}

#[test]
#[should_panic(expected: 'BAD_CLAIM')]
fn wrong_nullifier_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 1, make_claim_commitment(1, 7, 555), 1000);
    start_cheat_caller_address(contract_address, pool);
    let (r, s) = researcher_key().sign(make_claim_hash(1, 7, 556, 777)).unwrap();
    dispatcher.privacy_invoke(2, 1, 7, r, s, 0, 0, 556, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
}

#[test]
#[should_panic(expected: 'BAD_NULLIFIER')]
fn zero_nullifier_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(2, 1, 7, 1, 1, 0, 0, 0, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
}

#[test]
#[should_panic(expected: 'BAD_TIER')]
fn unknown_reward_tier_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 4, make_claim_commitment(1, 7, 555), 1000);
}

#[test]
#[should_panic(expected: 'AUTH_EXPIRED')]
fn expired_reward_authorization_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 0);
}

#[test]
#[should_panic(expected: 'INVALID_STATUS')]
fn decision_cannot_skip_acknowledgement() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.decide(1, 7, true);
}

#[test]
#[should_panic(expected: 'BAD_SIGNATURE')]
fn claim_cannot_substitute_destination_note() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 1, make_claim_commitment(1, 7, 555), 1000);
    start_cheat_caller_address(contract_address, pool);
    let (r, s) = researcher_key().sign(make_claim_hash(1, 7, 555, 777)).unwrap();
    dispatcher.privacy_invoke(2, 1, 7, r, s, 0, 0, 555, NOTE_MARKER_BEFORE, 778, NOTE_MARKER_AFTER);
}

#[test]
fn estimation_preview_accepts_only_zero_signature_and_returns_bound_note() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    start_cheat_caller_address(contract_address, pool);
    start_cheat_transaction_version(contract_address, ESTIMATION_VERSION);
    let deposits = dispatcher
        .privacy_invoke(2, 1, 7, 0, 0, 0, 0, 555, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
    assert(deposits.len() == 1, 'preview missing deposit');
    let deposit = *deposits.at(0);
    assert(deposit.note_id == 777, 'preview note mismatch');
}

#[test]
#[should_panic(expected: 'BAD_SIGNATURE')]
fn canonical_transaction_rejects_preview_signature() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(2, 1, 7, 0, 0, 0, 0, 555, NOTE_MARKER_BEFORE, 777, NOTE_MARKER_AFTER);
}

#[test]
#[should_panic(expected: 'BAD_CLAIM')]
fn claim_rejects_note_marker_substitution() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    let admin = address(222);
    create_program(dispatcher, contract_address, admin, token, 1);
    dispatcher.fund_program(1, 100);
    submit_case(dispatcher, contract_address, pool, 1, 7);
    start_cheat_caller_address(contract_address, admin);
    dispatcher.acknowledge(1, 7);
    dispatcher.decide(1, 7, true);
    dispatcher.authorize_reward(1, 7, 2, make_claim_commitment(1, 7, 555), 1000);
    let (r, s) = researcher_key().sign(make_claim_hash(1, 7, 555, 777)).unwrap();
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(2, 1, 7, r, s, 0, 0, 555, 1, 777, NOTE_MARKER_AFTER);
}

#[test]
fn signed_clarification_is_accepted() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    let key_pair = StarkCurveKeyPairImpl::generate();
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 128, key_pair.public_key, 0, 0, 0, 0);
    let message_hash = make_clarification_hash(1, 7, 301, 302, 64);
    let (r, s) = key_pair.sign(message_hash).unwrap();
    let deposits = dispatcher.privacy_invoke(1, 1, 7, 301, 302, 64, r, s, 0, 0, 0);
    assert(deposits.is_empty(), 'unexpected note');
}

#[test]
#[should_panic(expected: 'BAD_SIGNATURE')]
fn forged_clarification_is_rejected() {
    let (dispatcher, contract_address, pool, token) = deploy_protocol();
    create_program(dispatcher, contract_address, address(222), token, 1);
    let researcher = StarkCurveKeyPairImpl::generate();
    let attacker = StarkCurveKeyPairImpl::generate();
    start_cheat_caller_address(contract_address, pool);
    dispatcher.privacy_invoke(0, 1, 7, 201, 202, 128, researcher.public_key, 0, 0, 0, 0);
    let message_hash = make_clarification_hash(1, 7, 301, 302, 64);
    let (r, s) = attacker.sign(message_hash).unwrap();
    dispatcher.privacy_invoke(1, 1, 7, 301, 302, 64, r, s, 0, 0, 0);
}
