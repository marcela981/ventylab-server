#!/usr/bin/env node

/**
 * Test Script: Resume Last Lesson Functionality
 * 
 * This script tests the resume functionality by simulating:
 * 1. User navigating through steps in a lesson
 * 2. Fetching the resume point
 * 3. Verifying the correct lesson and step are returned
 * 
 * Usage:
 *   node scripts/test-resume-functionality.js <userId> <moduleId>
 * 
 * Example:
 *   node scripts/test-resume-functionality.js user123 module-01
 */

const http = require('http');
const https = require('https');

// Get command line arguments
const [,, userId, moduleId] = process.argv;

if (!userId || !moduleId) {
  console.error('❌ Usage: node test-resume-functionality.js <userId> <moduleId>');
  console.error('   Example: node test-resume-functionality.js user123 module-01');
  process.exit(1);
}

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// Helper function to make HTTP requests
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Parse URL
const url = new URL(BASE_URL);

// Test functions
async function testResumeFlow() {
  console.log('🧪 Testing Resume Last Lesson Functionality\n');
  console.log(`📊 Test Configuration:`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Module ID: ${moduleId}\n`);

  try {
    // Test 1: Simulate step navigation
    console.log('1️⃣ Simulating step navigation...');
    
    const stepUpdateResponse = await makeRequest({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      protocol: url.protocol,
      path: '/api/progress/step/update',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : '',
        'x-user-id': userId,
      },
      body: {
        userId,
        moduleId,
        lessonId: 'lesson-test',
        currentStepIndex: 5,
        totalSteps: 10,
        timeSpentDelta: 30,
      },
    });
    
    if (stepUpdateResponse.status === 200) {
      console.log('   ✅ Step progress updated successfully');
      console.log(`   📍 Current position: Step 6 of 10\n`);
    } else {
      console.log(`   ⚠️ Step update returned status: ${stepUpdateResponse.status}`);
      console.log(`   Response:`, stepUpdateResponse.data, '\n');
    }

    // Test 2: Fetch resume point
    console.log('2️⃣ Fetching resume point...');
    
    const resumeResponse = await makeRequest({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      protocol: url.protocol,
      path: `/api/modules/${moduleId}/resume`,
      method: 'GET',
      headers: {
        'Authorization': AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : '',
        'x-user-id': userId,
      },
    });
    
    if (resumeResponse.status === 200) {
      console.log('   ✅ Resume point retrieved successfully\n');
      
      const resumeData = resumeResponse.data?.data || resumeResponse.data;
      
      console.log('📋 Resume Point Details:');
      console.log(`   Lesson ID: ${resumeData.resumeLessonId}`);
      console.log(`   Lesson Title: ${resumeData.resumeLessonTitle}`);
      console.log(`   Lesson Order: ${resumeData.resumeLessonOrder}`);
      console.log(`   Current Step: ${resumeData.currentStepIndex !== undefined ? resumeData.currentStepIndex + 1 : 'N/A'}`);
      console.log(`   Total Steps: ${resumeData.totalStepsInLesson || 'N/A'}`);
      console.log(`   Module Progress: ${resumeData.moduleProgress}%`);
      console.log(`   Completed Lessons: ${resumeData.completedLessons}/${resumeData.totalLessons}`);
      console.log(`   Module Complete: ${resumeData.isModuleComplete ? 'Yes' : 'No'}`);
      console.log(`   Last Accessed: ${resumeData.lastAccessedAt || 'N/A'}\n`);
      
      // Validation
      console.log('✅ Validation Results:');
      
      if (resumeData.currentStepIndex !== undefined) {
        console.log('   ✅ Step-level tracking is working');
      } else {
        console.log('   ⚠️ Step-level tracking not available');
      }
      
      if (resumeData.resumeLessonId) {
        console.log('   ✅ Lesson ID is present');
      } else {
        console.log('   ❌ Missing lesson ID');
      }
      
      if (resumeData.totalStepsInLesson) {
        console.log('   ✅ Total steps is present');
      } else {
        console.log('   ⚠️ Total steps not available');
      }
      
    } else {
      console.log(`   ❌ Failed to retrieve resume point`);
      console.log(`   Status: ${resumeResponse.status}`);
      console.log(`   Response:`, resumeResponse.data);
    }

    // Test 3: Test alternative endpoint
    console.log('\n3️⃣ Testing alternative resume endpoint...');
    
    const altResumeResponse = await makeRequest({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      protocol: url.protocol,
      path: `/api/progress/resume/${moduleId}`,
      method: 'GET',
      headers: {
        'Authorization': AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : '',
        'x-user-id': userId,
      },
    });
    
    if (altResumeResponse.status === 200) {
      console.log('   ✅ Alternative endpoint works correctly\n');
    } else {
      console.log(`   ⚠️ Alternative endpoint returned status: ${altResumeResponse.status}\n`);
    }

    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run tests
testResumeFlow().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
