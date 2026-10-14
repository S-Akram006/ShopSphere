/**
 * ShopSphere State Machine Service
 * Enforces valid transition paths and role authorization for SubOrder lifecycle
 */

const ALLOWED_TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Packed', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  Delivered: ['Returned', 'Refunded'],
  Cancelled: [],
  Returned: ['Refunded'],
  Refunded: [],
};

const ROLE_PERMISSIONS = {
  Customer: {
    // Customers can cancel when Placed
    canTransition(currentStatus, targetStatus) {
      return currentStatus === 'Placed' && targetStatus === 'Cancelled';
    },
  },
  Seller: {
    // Sellers can advance from Placed -> Confirmed -> Packed -> Shipped, or Cancel
    canTransition(currentStatus, targetStatus) {
      const allowed = ['Confirmed', 'Packed', 'Shipped', 'Cancelled'];
      return allowed.includes(targetStatus);
    },
  },
  'Delivery Partner': {
    // Delivery partners can claim or advance Shipped -> Out for Delivery -> Delivered
    canTransition(currentStatus, targetStatus) {
      if (currentStatus === 'Packed' && targetStatus === 'Shipped') return true;
      if (currentStatus === 'Shipped' && targetStatus === 'Out for Delivery') return true;
      if (currentStatus === 'Out for Delivery' && targetStatus === 'Delivered') return true;
      return false;
    },
  },
  'Support Agent': {
    // Support agents can handle Disputes, Returns, Refunds, Cancellations
    canTransition(currentStatus, targetStatus) {
      return ['Cancelled', 'Returned', 'Refunded'].includes(targetStatus);
    },
  },
  'Platform Admin': {
    // Platform Admins have override privileges for any legitimate state machine flow
    canTransition(currentStatus, targetStatus) {
      return true;
    },
  },
};

/**
 * Validates whether a status transition is permitted by graph logic and user role
 */
function validateTransition(currentStatus, targetStatus, role) {
  // 1. Check if the target status is allowed from currentStatus
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      reason: `Illegal state transition from "${currentStatus}" to "${targetStatus}". Allowed next states: [${(allowedNext || []).join(', ')}]`,
    };
  }

  // 2. Check role authorization
  const roleChecker = ROLE_PERMISSIONS[role];
  if (!roleChecker || !roleChecker.canTransition(currentStatus, targetStatus)) {
    return {
      isValid: false,
      reason: `Role "${role}" is not authorized to transition an order from "${currentStatus}" to "${targetStatus}".`,
    };
  }

  return { isValid: true };
}

module.exports = {
  ALLOWED_TRANSITIONS,
  ROLE_PERMISSIONS,
  validateTransition,
};
