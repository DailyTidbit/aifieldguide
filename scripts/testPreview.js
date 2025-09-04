// scripts/testPreview.js
// Simple test script - no dependencies needed

async function testPreviewSystem() {
  // Use localhost since we&apos;re testing locally
  const baseUrl = 'http://localhost:3000'
  
  // REPLACE THIS with your actual company ID from the database
  const testCompanyId = '6c06c96b-1207-467e-841b-656f72d6ef1c'
  
  console.log('🧪 Testing Preview System...')
  console.log(`Base URL: ${baseUrl}`)
  
  if (testCompanyId === 'your-company-uuid-here') {
    console.log('❌ Please update testCompanyId with a real company UUID from your database!')
    console.log('\nTo find a company ID:')
    console.log('1. Go to Supabase SQL Editor')
    console.log('2. Run: SELECT id, name, domain FROM companies LIMIT 5;')
    console.log('3. Copy one of the id values')
    console.log('4. Replace "your-company-uuid-here" in this script')
    return
  }
  
  try {
    // Test 1: Generate a preview token
    console.log('\n1️⃣ Testing token generation...')
    const generateResponse = await fetch(`${baseUrl}/api/partners/preview/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: testCompanyId,
        expiresInHours: 72
      })
    })
    
    if (!generateResponse.ok) {
      console.error('❌ Token generation failed:', generateResponse.status, generateResponse.statusText)
      const errorText = await generateResponse.text()
      console.error('Error details:', errorText)
      
      if (generateResponse.status === 403) {
        console.log('\n🔐 This means you need to be logged in to your app first!')
        console.log('1. Go to http://localhost:3000')
        console.log('2. Sign in with any account')
        console.log('3. Then run this script again')
      }
      return
    }
    
    const tokenData = await generateResponse.json()
    console.log('✅ Token generated successfully!')
    console.log(`🔗 Preview URL: ${tokenData.previewUrl}`)
    console.log(`🏢 Company: ${tokenData.companyName}`)
    console.log(`⏰ Expires: ${new Date(tokenData.expiresAt).toLocaleString()}`)
    
    // Test 2: Validate the token
    console.log('\n2️⃣ Testing token validation...')
    const validateResponse = await fetch(`${baseUrl}/api/partners/preview/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: tokenData.token
      })
    })
    
    if (!validateResponse.ok) {
      console.error('❌ Token validation failed:', validateResponse.status)
      return
    }
    
    const validationData = await validateResponse.json()
    console.log('✅ Token validation successful!')
    console.log(`✓ Valid: ${validationData.isValid}`)
    console.log(`✓ Company: ${validationData.company?.name}`)
    console.log(`✓ Tool listings: ${validationData.preview?.toolListingsCount}`)
    
    // Test 3: List tokens for the company
    console.log('\n3️⃣ Testing token listing...')
    const listResponse = await fetch(`${baseUrl}/api/partners/preview/generate?companyId=${testCompanyId}`)
    
    if (!listResponse.ok) {
      console.error('❌ Token listing failed:', listResponse.status)
      return
    }
    
    const listData = await listResponse.json()
    console.log('✅ Token listing successful!')
    console.log(`📋 Found ${listData.tokens?.length || 0} tokens`)
    
    console.log('\n🎉 All tests passed!')
    console.log('\n📧 Email template:')
    console.log('─'.repeat(60))
    console.log(`Subject: Check out your ${tokenData.companyName} Daily Tidbit partner portal`)
    console.log(`
Hi there!

I wanted to show you what your company's Daily Tidbit partner portal would look like. Click the link below to see your personalized dashboard:

${tokenData.previewUrl}

You can explore everything - just click around and see all the features. When you&apos;re ready to sign up and manage your listings, there are clear prompts throughout the interface.

This preview link expires in 3 days.

Best regards,
Your Name
Daily Tidbit Team`)
    console.log('─'.repeat(60))
    
    console.log('\n🚀 Next steps:')
    console.log('1. Copy the preview URL above')
    console.log('2. Open it in an incognito browser window')
    console.log('3. You should see a read-only company portal!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('\n🔧 Make sure your Next.js server is running:')
      console.log('   npm run dev')
      console.log('   (in another terminal)')
    }
  }
}

// Quick setup instructions
function showSetupInstructions() {
  console.log('📋 Setup Instructions:')
  console.log('1. Make sure your Next.js server is running: npm run dev')
  console.log('2. Go to http://localhost:3000 and sign in with any account')
  console.log('3. Get a company ID from Supabase:')
  console.log('   - Go to Supabase SQL Editor')
  console.log('   - Run: SELECT id, name, domain FROM companies LIMIT 5;')
  console.log('   - Copy one of the id values')
  console.log('4. Replace "your-company-uuid-here" in this script with the real ID')
  console.log('5. Run: node scripts/testPreview.js')
  console.log('')
}

// Main execution
if (process.argv.includes('--help')) {
  showSetupInstructions()
} else {
  testPreviewSystem()
}