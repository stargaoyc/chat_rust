use jwt_simple::prelude::*;

use crate::{AppError, User};

const JWT_DURATION: u64 = 60 * 60 * 24 * 7;
const JWT_ISSUER: &str = "chat_server";
const JWT_AUDIENCE: &str = "chat_web";

#[allow(dead_code)]
#[derive(Debug)]
pub struct EncodingKey(Ed25519KeyPair);
#[allow(dead_code)]
#[derive(Debug)]
pub struct DecodingKey(Ed25519PublicKey);

#[allow(dead_code)]
impl EncodingKey {
    pub fn load(pem: &str) -> Result<Self, AppError> {
        Ok(Self(Ed25519KeyPair::from_pem(pem)?))
    }

    pub fn sign(&self, user: impl Into<User>) -> Result<String, AppError> {
        let claims = Claims::with_custom_claims(user.into(), Duration::from_secs(JWT_DURATION));
        let claims = claims.with_issuer(JWT_ISSUER).with_audience(JWT_AUDIENCE);
        Ok(self.0.sign(claims)?)
    }
}

#[allow(dead_code)]
impl DecodingKey {
    pub fn load(pem: &str) -> Result<Self, AppError> {
        Ok(Self(Ed25519PublicKey::from_pem(pem)?))
    }

    pub fn verify(&self, token: &str) -> Result<User, AppError> {
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

    #[tokio::test]
    async fn jwt_sign_and_verify_should_work() -> Result<()> {
        let encoding_key = include_str!("../../fixtures/encoding.pem");
        let decoding_key = include_str!("../../fixtures/decoding.pem");
        let ek = EncodingKey::load(encoding_key)?;
        let dk = DecodingKey::load(decoding_key)?;
        let user = User::new(1, "John Doe", "john.doe@example.com");

        let token = ek.sign(user.clone())?;
        let decoded_user = dk.verify(&token)?;

        assert_eq!(user, decoded_user);
        Ok(())
    }
}
