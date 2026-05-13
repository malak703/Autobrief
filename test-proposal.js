// Simple test to check if proposal API works
const testProposalGeneration = async () => {
  const testData = {
    pageData: {
      brief: { content: "Test brief content" },
      sections: [
        { id: "test", title: "Test Section", content: "Test content" }
      ],
      followupAnswers: { "followup-0": "Test answer" },
      additionalComments: "Test comments"
    },
    token: "test-token"
  };

  try {
    console.log('Testing proposal generation...');
    const response = await fetch('http://localhost:3000/api/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Success:', result);
    } else {
      const errorText = await response.text();
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testProposalGeneration();
