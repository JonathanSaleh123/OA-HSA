const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';
let accountId = '';
let cardId = '';

// Helper function to make authenticated requests
const makeAuthRequest = (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const testHealthCheck = async () => {
  try {
    console.log('🔍 Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  try {
    console.log('🔍 Testing user registration...');
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    console.log('✅ User registration passed:', response.data.message);
    authToken = response.data.token;
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists, trying login...');
      return await testUserLogin();
    }
    console.error('❌ User registration failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testUserLogin = async () => {
  try {
    console.log('🔍 Testing user login...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    console.log('✅ User login passed:', response.data.message);
    authToken = response.data.token;
    return true;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testGetAccount = async () => {
  try {
    console.log('🔍 Testing get account...');
    const response = await makeAuthRequest('get', '/api/accounts');
    console.log('✅ Get account passed:', response.data.account);
    accountId = response.data.account.id;
    return true;
  } catch (error) {
    console.error('❌ Get account failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testDepositFunds = async () => {
  try {
    console.log('🔍 Testing deposit funds...');
    const response = await makeAuthRequest('post', `/api/accounts/${accountId}/deposit`, {
      amount: 1000.00
    });
    console.log('✅ Deposit funds passed:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Deposit funds failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testIssueCard = async () => {
  try {
    console.log('🔍 Testing issue card...');
    const response = await makeAuthRequest('post', '/api/cards', {
      accountId: accountId
    });
    console.log('✅ Issue card passed:', response.data.message);
    cardId = response.data.card.id;
    return true;
  } catch (error) {
    console.error('❌ Issue card failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testProcessTransaction = async () => {
  try {
    console.log('🔍 Testing process transaction (medical)...');
    const response = await makeAuthRequest('post', '/api/transactions', {
      cardId: cardId,
      merchantName: 'Dr. Smith Medical Clinic',
      merchantCode: '8011',
      amount: 150.00
    });
    console.log('✅ Process transaction passed:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Process transaction failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testNonMedicalTransaction = async () => {
  try {
    console.log('🔍 Testing non-medical transaction...');
    const response = await makeAuthRequest('post', '/api/transactions', {
      cardId: cardId,
      merchantName: 'Grocery Store',
      merchantCode: '5411',
      amount: 50.00
    });
    console.log('✅ Non-medical transaction test passed:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Non-medical transaction test failed:', error.response?.data?.error || error.message);
    return false;
  }
};

const testGetTransactions = async () => {
  try {
    console.log('🔍 Testing get transactions...');
    const response = await makeAuthRequest('get', '/api/transactions');
    console.log('✅ Get transactions passed:', response.data.transactions.length, 'transactions found');
    return true;
  } catch (error) {
    console.error('❌ Get transactions failed:', error.response?.data?.error || error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting HSA Backend API Tests...\n');
  
  const tests = [
    testHealthCheck,
    testUserRegistration,
    testGetAccount,
    testDepositFunds,
    testIssueCard,
    testProcessTransaction,
    testNonMedicalTransaction,
    testGetTransactions
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const result = await test();
    if (result) passedTests++;
    console.log(''); // Add spacing between tests
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend setup.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testGetAccount,
  testDepositFunds,
  testIssueCard,
  testProcessTransaction,
  testNonMedicalTransaction,
  testGetTransactions
};
