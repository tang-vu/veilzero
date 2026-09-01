mod protocol;
use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[starknet::interface]
pub trait IERC20<TState> {
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IVeilZero<TState> {
    fn create_program(
        ref self: TState,
        program_id: felt252,
        encryption_key_commitment: felt252,
        policy_commitment: felt252,
        acknowledgement_sla: u64,
        remediation_sla: u64,
        token: ContractAddress,
        tier_1: u128,
        tier_2: u128,
        tier_3: u128,
    );
    fn fund_program(ref self: TState, program_id: felt252, amount: u128);
    fn acknowledge(ref self: TState, program_id: felt252, case_id: felt252);
    fn decide(ref self: TState, program_id: felt252, case_id: felt252, accepted: bool);
    fn authorize_reward(
        ref self: TState,
        program_id: felt252,
        case_id: felt252,
        tier: u8,
        nullifier: felt252,
        expiry: u64,
    );
    fn privacy_invoke(
        ref self: TState,
        action: u8,
        program_id: felt252,
        case_id: felt252,
        report_commitment: felt252,
        ciphertext_hash: felt252,
        payload_size: u32,
        auth_commitment: felt252,
        nullifier: felt252,
        note_id: felt252,
    ) -> Span<OpenNoteDeposit>;
    fn get_case_status(self: @TState, program_id: felt252, case_id: felt252) -> u8;
    fn get_reserve(self: @TState, program_id: felt252) -> u128;
}

#[starknet::contract]
mod VeilZero {
    use core::num::traits::Zero;
    use core::poseidon::poseidon_hash_span;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use super::{IERC20Dispatcher, IERC20DispatcherTrait, OpenNoteDeposit};

    const MAX_PAYLOAD_SIZE: u32 = 16384;
    const ACTION_SUBMIT: u8 = 0;
    const ACTION_CLARIFY: u8 = 1;
    const ACTION_CLAIM: u8 = 2;

    mod errors {
        pub const ONLY_POOL: felt252 = 'ONLY_POOL';
        pub const ONLY_ADMIN: felt252 = 'ONLY_ADMIN';
        pub const PROGRAM_EXISTS: felt252 = 'PROGRAM_EXISTS';
        pub const UNKNOWN_PROGRAM: felt252 = 'UNKNOWN_PROGRAM';
        pub const INVALID_CONFIG: felt252 = 'INVALID_CONFIG';
        pub const CASE_EXISTS: felt252 = 'CASE_EXISTS';
        pub const UNKNOWN_CASE: felt252 = 'UNKNOWN_CASE';
        pub const INVALID_STATUS: felt252 = 'INVALID_STATUS';
        pub const EMPTY_PAYLOAD: felt252 = 'EMPTY_PAYLOAD';
        pub const PAYLOAD_TOO_LARGE: felt252 = 'PAYLOAD_TOO_LARGE';
        pub const ZERO_COMMITMENT: felt252 = 'ZERO_COMMITMENT';
        pub const BAD_ACTION: felt252 = 'BAD_ACTION';
        pub const BAD_TIER: felt252 = 'BAD_TIER';
        pub const BAD_NULLIFIER: felt252 = 'BAD_NULLIFIER';
        pub const NULLIFIER_USED: felt252 = 'NULLIFIER_USED';
        pub const AUTH_EXPIRED: felt252 = 'AUTH_EXPIRED';
        pub const INSUFFICIENT_RESERVE: felt252 = 'INSUFFICIENT_RESERVE';
        pub const TOKEN_TRANSFER_FAILED: felt252 = 'TOKEN_TRANSFER_FAILED';
    }

    #[storage]
    struct Storage {
        pool: ContractAddress,
        program_admin: Map<felt252, ContractAddress>,
        program_token: Map<felt252, ContractAddress>,
        program_reserve: Map<felt252, u128>,
        program_tiers: Map<(felt252, u8), u128>,
        acknowledgement_sla: Map<felt252, u64>,
        remediation_sla: Map<felt252, u64>,
        encryption_key_commitment: Map<felt252, felt252>,
        policy_commitment: Map<felt252, felt252>,
        case_status: Map<felt252, u8>,
        case_created_at: Map<felt252, u64>,
        case_report_commitment: Map<felt252, felt252>,
        case_auth_commitment: Map<felt252, felt252>,
        reward_tier: Map<felt252, u8>,
        reward_nullifier: Map<felt252, felt252>,
        reward_expiry: Map<felt252, u64>,
        used_nullifiers: Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ProgramCreated: ProgramCreated,
        ProgramFunded: ProgramFunded,
        CaseSubmitted: CaseSubmitted,
        CaseStatusChanged: CaseStatusChanged,
        RewardAuthorized: RewardAuthorized,
        RewardSettled: RewardSettled,
        ClarificationCommitted: ClarificationCommitted,
    }
    #[derive(Drop, starknet::Event)]
    struct ProgramCreated {
        #[key]
        program_id: felt252,
        #[key]
        admin: ContractAddress,
        policy_commitment: felt252,
    }
    #[derive(Drop, starknet::Event)]
    struct ProgramFunded {
        #[key]
        program_id: felt252,
        amount: u128,
        reserve: u128,
    }
    #[derive(Drop, starknet::Event)]
    struct CaseSubmitted {
        #[key]
        program_id: felt252,
        #[key]
        case_id: felt252,
        report_commitment: felt252,
        ciphertext_hash: felt252,
        payload_size: u32,
        acknowledgement_deadline: u64,
    }
    #[derive(Drop, starknet::Event)]
    struct CaseStatusChanged {
        #[key]
        program_id: felt252,
        #[key]
        case_id: felt252,
        status: u8,
        at: u64,
    }
    #[derive(Drop, starknet::Event)]
    struct RewardAuthorized {
        #[key]
        program_id: felt252,
        #[key]
        case_id: felt252,
        tier: u8,
        nullifier: felt252,
        expiry: u64,
    }
    #[derive(Drop, starknet::Event)]
    struct RewardSettled {
        #[key]
        program_id: felt252,
        #[key]
        case_id: felt252,
        nullifier: felt252,
        amount: u128,
        note_id: felt252,
    }
    #[derive(Drop, starknet::Event)]
    struct ClarificationCommitted {
        #[key]
        program_id: felt252,
        #[key]
        case_id: felt252,
        commitment: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, pool: ContractAddress) {
        assert(!pool.is_zero(), errors::INVALID_CONFIG);
        self.pool.write(pool);
    }

    fn case_key(program_id: felt252, case_id: felt252) -> felt252 {
        poseidon_hash_span(array![program_id, case_id].span())
    }
    fn assert_admin(self: @ContractState, program_id: felt252) {
        let admin = self.program_admin.entry(program_id).read();
        assert(!admin.is_zero(), errors::UNKNOWN_PROGRAM);
        assert(get_caller_address() == admin, errors::ONLY_ADMIN);
    }

    #[abi(embed_v0)]
    impl VeilZeroImpl of super::IVeilZero<ContractState> {
        fn create_program(
            ref self: ContractState,
            program_id: felt252,
            encryption_key_commitment: felt252,
            policy_commitment: felt252,
            acknowledgement_sla: u64,
            remediation_sla: u64,
            token: ContractAddress,
            tier_1: u128,
            tier_2: u128,
            tier_3: u128,
        ) {
            assert(
                program_id != 0 && encryption_key_commitment != 0 && policy_commitment != 0,
                errors::INVALID_CONFIG,
            );
            assert(
                acknowledgement_sla > 0 && remediation_sla > acknowledgement_sla,
                errors::INVALID_CONFIG,
            );
            assert(
                tier_1 > 0 && tier_2 > tier_1 && tier_3 > tier_2 && !token.is_zero(),
                errors::INVALID_CONFIG,
            );
            assert(self.program_admin.entry(program_id).read().is_zero(), errors::PROGRAM_EXISTS);
            let admin = get_caller_address();
            self.program_admin.entry(program_id).write(admin);
            self.program_token.entry(program_id).write(token);
            self.program_tiers.entry((program_id, 1)).write(tier_1);
            self.program_tiers.entry((program_id, 2)).write(tier_2);
            self.program_tiers.entry((program_id, 3)).write(tier_3);
            self.acknowledgement_sla.entry(program_id).write(acknowledgement_sla);
            self.remediation_sla.entry(program_id).write(remediation_sla);
            self.encryption_key_commitment.entry(program_id).write(encryption_key_commitment);
            self.policy_commitment.entry(program_id).write(policy_commitment);
            self.emit(ProgramCreated { program_id, admin, policy_commitment });
        }

        fn fund_program(ref self: ContractState, program_id: felt252, amount: u128) {
            assert_admin(@self, program_id);
            assert(amount > 0, errors::INVALID_CONFIG);
            let token = IERC20Dispatcher {
                contract_address: self.program_token.entry(program_id).read(),
            };
            assert(
                token.transfer_from(get_caller_address(), get_contract_address(), amount.into()),
                errors::TOKEN_TRANSFER_FAILED,
            );
            let reserve = self.program_reserve.entry(program_id).read() + amount;
            self.program_reserve.entry(program_id).write(reserve);
            self.emit(ProgramFunded { program_id, amount, reserve });
        }

        fn acknowledge(ref self: ContractState, program_id: felt252, case_id: felt252) {
            assert_admin(@self, program_id);
            let key = case_key(program_id, case_id);
            assert(self.case_status.entry(key).read() == 1, errors::INVALID_STATUS);
            self.case_status.entry(key).write(2);
            self
                .emit(
                    CaseStatusChanged { program_id, case_id, status: 2, at: get_block_timestamp() },
                );
        }

        fn decide(ref self: ContractState, program_id: felt252, case_id: felt252, accepted: bool) {
            assert_admin(@self, program_id);
            let key = case_key(program_id, case_id);
            assert(self.case_status.entry(key).read() == 2, errors::INVALID_STATUS);
            let status = if accepted {
                3
            } else {
                6
            };
            self.case_status.entry(key).write(status);
            self.emit(CaseStatusChanged { program_id, case_id, status, at: get_block_timestamp() });
        }

        fn authorize_reward(
            ref self: ContractState,
            program_id: felt252,
            case_id: felt252,
            tier: u8,
            nullifier: felt252,
            expiry: u64,
        ) {
            assert_admin(@self, program_id);
            let key = case_key(program_id, case_id);
            assert(self.case_status.entry(key).read() == 3, errors::INVALID_STATUS);
            let amount = self.program_tiers.entry((program_id, tier)).read();
            assert(amount > 0, errors::BAD_TIER);
            assert(nullifier != 0, errors::BAD_NULLIFIER);
            assert(!self.used_nullifiers.entry(nullifier).read(), errors::NULLIFIER_USED);
            assert(expiry > get_block_timestamp(), errors::AUTH_EXPIRED);
            assert(
                self.program_reserve.entry(program_id).read() >= amount,
                errors::INSUFFICIENT_RESERVE,
            );
            self.reward_tier.entry(key).write(tier);
            self.reward_nullifier.entry(key).write(nullifier);
            self.reward_expiry.entry(key).write(expiry);
            self.case_status.entry(key).write(4);
            self.emit(RewardAuthorized { program_id, case_id, tier, nullifier, expiry });
        }

        fn privacy_invoke(
            ref self: ContractState,
            action: u8,
            program_id: felt252,
            case_id: felt252,
            report_commitment: felt252,
            ciphertext_hash: felt252,
            payload_size: u32,
            auth_commitment: felt252,
            nullifier: felt252,
            note_id: felt252,
        ) -> Span<OpenNoteDeposit> {
            assert(get_caller_address() == self.pool.read(), errors::ONLY_POOL);
            assert(!self.program_admin.entry(program_id).read().is_zero(), errors::UNKNOWN_PROGRAM);
            let key = case_key(program_id, case_id);
            if action == ACTION_SUBMIT {
                assert(self.case_status.entry(key).read() == 0, errors::CASE_EXISTS);
                assert(
                    report_commitment != 0 && ciphertext_hash != 0 && auth_commitment != 0,
                    errors::ZERO_COMMITMENT,
                );
                assert(payload_size > 0, errors::EMPTY_PAYLOAD);
                assert(payload_size <= MAX_PAYLOAD_SIZE, errors::PAYLOAD_TOO_LARGE);
                let now = get_block_timestamp();
                self.case_status.entry(key).write(1);
                self.case_created_at.entry(key).write(now);
                self.case_report_commitment.entry(key).write(report_commitment);
                self.case_auth_commitment.entry(key).write(auth_commitment);
                self
                    .emit(
                        CaseSubmitted {
                            program_id,
                            case_id,
                            report_commitment,
                            ciphertext_hash,
                            payload_size,
                            acknowledgement_deadline: now
                                + self.acknowledgement_sla.entry(program_id).read(),
                        },
                    );
                return array![].span();
            }
            if action == ACTION_CLARIFY {
                let status = self.case_status.entry(key).read();
                assert(status == 1 || status == 2, errors::INVALID_STATUS);
                assert(report_commitment != 0, errors::ZERO_COMMITMENT);
                self
                    .emit(
                        ClarificationCommitted {
                            program_id, case_id, commitment: report_commitment,
                        },
                    );
                return array![].span();
            }
            assert(action == ACTION_CLAIM, errors::BAD_ACTION);
            assert(self.case_status.entry(key).read() == 4, errors::INVALID_STATUS);
            assert(
                nullifier != 0 && nullifier == self.reward_nullifier.entry(key).read(),
                errors::BAD_NULLIFIER,
            );
            assert(!self.used_nullifiers.entry(nullifier).read(), errors::NULLIFIER_USED);
            assert(
                get_block_timestamp() <= self.reward_expiry.entry(key).read(), errors::AUTH_EXPIRED,
            );
            assert(note_id != 0, errors::BAD_NULLIFIER);
            let tier = self.reward_tier.entry(key).read();
            let amount = self.program_tiers.entry((program_id, tier)).read();
            let reserve = self.program_reserve.entry(program_id).read();
            assert(reserve >= amount, errors::INSUFFICIENT_RESERVE);
            self.used_nullifiers.entry(nullifier).write(true);
            self.case_status.entry(key).write(5);
            self.program_reserve.entry(program_id).write(reserve - amount);
            let token_address = self.program_token.entry(program_id).read();
            let token = IERC20Dispatcher { contract_address: token_address };
            assert(token.approve(self.pool.read(), amount.into()), errors::TOKEN_TRANSFER_FAILED);
            self.emit(RewardSettled { program_id, case_id, nullifier, amount, note_id });
            array![OpenNoteDeposit { note_id, token: token_address, amount }].span()
        }

        fn get_case_status(self: @ContractState, program_id: felt252, case_id: felt252) -> u8 {
            self.case_status.entry(case_key(program_id, case_id)).read()
        }
        fn get_reserve(self: @ContractState, program_id: felt252) -> u128 {
            self.program_reserve.entry(program_id).read()
        }
    }
}
