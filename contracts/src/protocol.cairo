pub const SUBMITTED: u8 = 1;
pub const ACKNOWLEDGED: u8 = 2;
pub const ACCEPTED: u8 = 3;
pub const AUTHORIZED: u8 = 4;
pub const SETTLED: u8 = 5;
pub const REJECTED: u8 = 6;
pub const MAX_PAYLOAD: u32 = 16384;

pub fn valid_transition(from: u8, to: u8) -> bool {
    (from == 0 && to == SUBMITTED)
        || (from == SUBMITTED && to == ACKNOWLEDGED)
        || (from == ACKNOWLEDGED && (to == ACCEPTED || to == REJECTED))
        || (from == ACCEPTED && to == AUTHORIZED)
        || (from == AUTHORIZED && to == SETTLED)
}
pub fn valid_payload(size: u32, report: felt252, ciphertext: felt252) -> bool {
    size > 0 && size <= MAX_PAYLOAD && report != 0 && ciphertext != 0
}
pub fn valid_tiers(a: u128, b: u128, c: u128) -> bool {
    a > 0 && b > a && c > b
}
pub fn within_expiry(now: u64, expiry: u64) -> bool {
    expiry >= now
}

#[cfg(test)]
mod tests {
    use super::{
        ACCEPTED, ACKNOWLEDGED, AUTHORIZED, MAX_PAYLOAD, REJECTED, SETTLED, SUBMITTED,
        valid_payload, valid_tiers, valid_transition, within_expiry,
    };

    #[test]
    fn lifecycle_happy_path() {
        assert!(valid_transition(0, SUBMITTED));
        assert!(valid_transition(SUBMITTED, ACKNOWLEDGED));
        assert!(valid_transition(ACKNOWLEDGED, ACCEPTED));
        assert!(valid_transition(ACCEPTED, AUTHORIZED));
        assert!(valid_transition(AUTHORIZED, SETTLED));
    }
    #[test]
    fn rejection_is_terminal() {
        assert!(valid_transition(ACKNOWLEDGED, REJECTED));
        assert!(!valid_transition(REJECTED, AUTHORIZED));
    }
    #[test]
    fn cannot_skip_acknowledgement() {
        assert!(!valid_transition(SUBMITTED, ACCEPTED));
    }
    #[test]
    fn cannot_double_settle() {
        assert!(!valid_transition(SETTLED, SETTLED));
    }
    #[test]
    fn payload_boundaries() {
        assert!(!valid_payload(0, 1, 1));
        assert!(valid_payload(1, 1, 1));
        assert!(valid_payload(MAX_PAYLOAD, 1, 1));
        assert!(!valid_payload(MAX_PAYLOAD + 1, 1, 1));
        assert!(!valid_payload(10, 0, 1));
        assert!(!valid_payload(10, 1, 0));
    }
    #[test]
    fn tiers_are_fixed_and_ordered() {
        assert!(valid_tiers(1, 2, 3));
        assert!(!valid_tiers(0, 2, 3));
        assert!(!valid_tiers(1, 1, 3));
        assert!(!valid_tiers(3, 2, 1));
    }
    #[test]
    fn expiry_boundary_is_inclusive() {
        assert!(within_expiry(100, 100));
        assert!(!within_expiry(101, 100));
    }
}
