require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  const testSpell = {
    name: 'testSpell',
    level: '3',
    description: 'test',
  };

  let token;

  beforeAll(async done => {
    execSync('npm run setup-db');

    client.connect();

    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'jon@user.com',
        password: '1234'
      });
    
    token = signInData.body.token;

    return done();
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns search results from dnd 5e api', async(done) => {
    const expectation = 
      {
        'count': 1,
        'next': null,
        'previous': null,
        'results': [
          {
            'slug': 'acid-arrow',
            'name': 'Acid Arrow',
            'desc': 'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target. On a hit, the target takes 4d4 acid damage immediately and 2d4 acid damage at the end of its next turn. On a miss, the arrow splashes the target with acid for half as much of the initial damage and no damage at the end of its next turn.',
            'higher_level': 'When you cast this spell using a spell slot of 3rd level or higher, the damage (both initial and later) increases by 1d4 for each slot level above 2nd.',
            'page': 'phb 259',
            'range': '90 feet',
            'components': 'V, S, M',
            'material': 'Powdered rhubarb leaf and an adder\'s stomach.',
            'ritual': 'no',
            'duration': 'Instantaneous',
            'concentration': 'no',
            'casting_time': '1 action',
            'level': '2nd-level',
            'level_int': 2,
            'school': 'Evocation',
            'dnd_class': 'Druid, Wizard',
            'archetype': 'Druid: Swamp',
            'circles': 'Swamp',
            'document__slug': 'wotc-srd',
            'document__title': 'Systems Reference Document',
            'document__license_url': 'http://open5e.com/legal'
          }
        ],
      };

    const data = await fakeRequest(app)
      .get('/search?searchQuery=acid arrow')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);

    done();
  });


  test('creates a new favorite on POST', async(done) => {
    const expectation = {
      ...testSpell,
      id: 4,
      user_id: 2
    };

    const data = await fakeRequest(app)
      .post('/api/favorites')
      .set('Authorization', token)
      .send(testSpell)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);

    done();
  });

  test('gets all favorites for a user on GET', async(done) => {
    const expectation = [{
      ...testSpell,
      id: 4,
      user_id: 2
    }];

    const data = await fakeRequest(app)
      .get('/api/favorites')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);

    done();
  });

  test('deletes a favorite on DELETE', async(done) => {
    const expectation = [];

    await fakeRequest(app)
      .delete('/api/favorites/4')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    const data = await fakeRequest(app)
      .get('/api/favorites')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    // when i fetch all favorites for this user, i expect it now to be empty
    expect(data.body).toEqual(expectation);

    done();
  });
});
