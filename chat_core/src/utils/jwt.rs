use jwt_simple::prelude::*;

use crate::User;

const JWT_DURATION: u64 = 60 * 60 * 24 * 7;
const JWT_ISSUER: &str = "chat_server";
const JWT_AUDIENCE: &str = "chat_web";

#[derive(Debug)]
pub struct EncodingKey(Ed25519KeyPair);

#[derive(Debug)]
pub struct DecodingKey(Ed25519PublicKey);

impl EncodingKey {
    pub fn load(pem: &str) -> Result<Self, jwt_simple::Error> {
        Ok(Self(Ed25519KeyPair::from_pem(pem)?))
    }

    pub fn sign(&self, user: impl Into<User>) -> Result<String, jwt_simple::Error> {
        let claims = Claims::with_custom_claims(user.into(), Duration::from_secs(JWT_DURATION));
        let claims = claims.with_issuer(JWT_ISSUER).with_audience(JWT_AUDIENCE);
        self.0.sign(claims)
    }
}

impl DecodingKey {
    pub fn load(pem: &str) -> Result<Self, jwt_simple::Error> {
        Ok(Self(Ed25519PublicKey::from_pem(pem)?))
    }

    pub fn verify(&self, token: &str) -> Result<User, jwt_simple::Error> {
        let options = VerificationOptions {
            allowed_audiences: Some(HashSet::from_strings(&[JWT_AUDIENCE])),
            allowed_issuers: Some(HashSet::from_strings(&[JWT_ISSUER])),
            ..Default::default()
        };
        let claims = self.0.verify_token::<User>(token, Some(options))?;
        Ok(claims.custom)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use chrono::prelude::Utc;

    #[tokio::test]
    async fn jwt_sign_and_verify_should_work() -> Result<()> {
        let encoding_key = include_str!("../../fixtures/encoding.pem");
        let decoding_key = include_str!("../../fixtures/decoding.pem");
        let ek = EncodingKey::load(encoding_key)?;
        let dk = DecodingKey::load(decoding_key)?;
        let user = User {
            id: 1,
            ws_id: 0,
            fullname: "John Doe".to_string(),
            email: "john.doe@example.com".to_string(),
            password_hash: None,
            created_at: Utc::now(),
        };

        let token = ek.sign(user.clone())?;
        let decoded_user = dk.verify(&token)?;

        assert_eq!(user, decoded_user);
        Ok(())
    }
}
