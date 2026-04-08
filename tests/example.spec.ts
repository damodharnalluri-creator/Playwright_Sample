import { test, expect } from '@playwright/test';
test('Get', async ({ request }) => {
//  const response = await request.get('https://playwright.dev/');
const response = await request.get('https://conduit-api.bondaracademy.com/api/tags');
 const text = await response.text();
 const respnceoject = await response.json();
 console.log(respnceoject);
 expect(text).toContain('Slack');
});
test('POST', async ({ request }) => {
//  const response = await request.get('https://playwright.dev/');
const response = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
  headers: {
   Authorization: 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo1MDQzNn0sImlhdCI6MTc3NDY2Nzg3OCwiZXhwIjoxNzc5ODUxODc4fQ.vBQtpR9paaVhUXL2G4VXfHg-QnRtgXDiXEA8WZSqc9U'
  },
  data: {
    "article": {
      "title": "TEST TEST123",
      "description": "TEST TESing123",
      "body": "Body updated123",
      "tagList": []}
  }
})
 const respnceoject = await response.json();
 console.log(respnceoject);
});