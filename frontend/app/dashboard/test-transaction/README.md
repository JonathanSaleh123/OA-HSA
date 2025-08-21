# Test Transaction Page

This page allows you to test the transaction validation functionality of the HSA system.

## Features

### 1. Card Selection
- Select from your available debit cards
- Only active, non-expired cards are shown

### 2. Sample Merchant Codes
The page includes sample merchant codes for testing:
- **Medical Expenses (Eligible for HSA):**
  - 8011 - Doctors
  - 8020 - Dentists
  - 8031 - Osteopathic Physicians
  - 8041 - Chiropractors
  - 8042 - Optometrists
  - 8043 - Ophthalmologists
  - 8049 - Podiatrists
  - 8050 - Nursing and Personal Care Facilities
  - 8062 - Hospitals
  - 8071 - Medical and Dental Laboratories
  - 8099 - Health Practitioners
  - 5912 - Drug Stores and Pharmacies
  - 5122 - Drugs and Drug Supplies
  - 5047 - Medical Equipment and Supplies

- **Non-Medical Expenses (Not Eligible for HSA):**
  - 5411 - Grocery Stores, Supermarkets
  - 5541 - Service Stations
  - 5999 - Miscellaneous Retail Stores

### 3. Merchant Validation
- Enter a merchant code to validate
- See if the merchant code exists in the system
- Check if it's classified as a medical expense
- Understand eligibility for HSA funds

### 4. Test Transactions
- Process test transactions with real validation
- See transaction approval/decline based on merchant type
- View account balance changes
- Get detailed transaction results

## How to Use

1. **Select a Card**: Choose one of your active debit cards
2. **Enter Transaction Details**:
   - Merchant Code (e.g., 8011 for Doctors)
   - Merchant Name (e.g., "Dr. Smith's Office")
   - Amount (e.g., 150.00)
3. **Validate Merchant**: Click "Validate Merchant" to check the merchant code
4. **Process Transaction**: Click "Process Test Transaction" to simulate a real transaction

## Expected Results

- **Medical Expenses**: Will be approved and deducted from your HSA balance
- **Non-Medical Expenses**: Will be declined with a message explaining why
- **Invalid Merchant Codes**: Will show as unknown/not found

## Testing Scenarios

1. **Test Medical Transaction**: Use code 8011 (Doctors) - should approve
2. **Test Non-Medical Transaction**: Use code 5411 (Grocery) - should decline
3. **Test Invalid Code**: Use a random code - should show as unknown
4. **Test Insufficient Funds**: Try a transaction larger than your balance

## Notes

- This is a testing environment - transactions are real and will affect your account balance
- Use small amounts for testing
- The system validates merchant codes against the database
- All transactions are logged and visible in your transaction history
