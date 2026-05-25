use std::{env, fs::File};

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerConfig {
    pub port: u16,
}

impl AppConfig {
    pub fn load() -> Result<Self> {
        let ret = match (
            File::open("app.yaml"),
            File::open("/etc/config/app.yaml"),
            env::var("CHAT_CONFIG"),
        ) {
            (Ok(file), _, _) => serde_yaml::from_reader(file)?,
            (_, Ok(file), _) => serde_yaml::from_reader(file)?,
            (_, _, Ok(path)) => {
                let file = File::open(path)?;
                serde_yaml::from_reader(file)?
            }
            _ => bail!("No configuration file found"),
        };

        Ok(ret)
    }
}
