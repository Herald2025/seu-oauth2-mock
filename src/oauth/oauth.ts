import OAuth2Server from 'oauth2-server';
import model from './model.js';

const oauth = new OAuth2Server({
  model: model,
  accessTokenLifetime: 60 * 60, // 1 hour
  allowBearerTokensInQueryString: true,
});

export default oauth;
