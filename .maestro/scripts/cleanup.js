// Deletes what the flows created, even when a flow fails halfway.
// Runs on the computer (not on the device), so localhost is the local API.
const API_URL = 'http://localhost:8081';
const PREFIX = 'E2E ';

const signIn = http.post(API_URL + '/auth/login', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: MAESTRO_TEST_EMAIL, password: MAESTRO_TEST_PASSWORD }),
});
if (!signIn.ok) throw new Error('Cleanup sign-in failed: ' + signIn.status);

const headers = { Authorization: 'Bearer ' + json(signIn.body).data.accessToken };

function list(path) {
  const response = http.get(API_URL + path + '?size=100', { headers: headers });
  if (!response.ok) throw new Error('Cleanup list failed: ' + response.status);
  return json(response.body).data;
}

function deleteMatching(listPath, itemPath, label) {
  list(listPath)
    .filter(function (item) {
      return String(item[label]).indexOf(PREFIX) === 0;
    })
    .forEach(function (item) {
      http.delete(API_URL + itemPath + item.id, { headers: headers });
    });
}

list('/farm-member').forEach(function (member) {
  deleteMatching('/field/farm/' + member.farm.id, '/field/', 'name');
  deleteMatching('/occurrence/farm/' + member.farm.id, '/occurrence/', 'title');
});
