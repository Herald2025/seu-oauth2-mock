import OAuth2Server from 'oauth2-server';
import model from './model.js';

const oauth = new OAuth2Server({
  model: model,
  accessTokenLifetime: 60 * 60 * 8, // 8 hours (28800 seconds) to match SEU system
  allowBearerTokensInQueryString: true,
});

export default oauth;
