use std::{
    path::{Path, PathBuf},
    str::FromStr,
};

use sha2::{Digest, Sha256};

use crate::{AppError, ChatFile};

impl ChatFile {
    pub fn new(ws_id: u64, filename: &str, data: &[u8]) -> Self {
        let hash = Sha256::digest(data);
        let ext = Path::new(filename)
            .extension() // 获取最后一个扩展名
            .and_then(|os| os.to_str()) // 转为 &str
            .filter(|s| !s.is_empty())
            .unwrap_or("bin") // 若没有，默认 "bin"（不建议默认为 txt）
            .to_string();
        Self {
            ws_id,
            ext,
            hash: hex::encode(hash),
        }
    }

    pub fn url(&self) -> String {
        format!("/files/{}", self.hash_to_path())
    }

    pub fn path(&self, base_dir: &Path) -> PathBuf {
        base_dir.join(self.hash_to_path())
    }

    pub fn hash_to_path(&self) -> String {
        let (part1, part2) = self.hash.split_at(3);
        let (part2, part3) = part2.split_at(3);
        format!("{}/{}/{}/{}.{}", self.ws_id, part1, part2, part3, self.ext)
    }
}

impl FromStr for ChatFile {
    type Err = AppError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let Some(s) = s.strip_prefix("/files/") else {
            return Err(AppError::ChatFileError(format!(
                "Invalid chat file path: {}",
                s
            )));
        };
        let parts: Vec<&str> = s.split("/").collect();
        if parts.len() != 4 {
            return Err(AppError::ChatFileError(format!(
                "Invalid chat file path: {}",
                s
            )));
        }
        let Ok(ws_id) = parts[0].parse::<u64>() else {
            return Err(AppError::ChatFileError(format!(
                "Invalid workspace id: {}",
                parts[0]
            )));
        };
        let Some((part3, ext)) = parts[3].split_once(".") else {
            return Err(AppError::ChatFileError(format!(
                "Invalid file name: {}",
                parts[3]
            )));
        };
        let hash = format!("{}{}{}", parts[1], parts[2], part3);
        Ok(Self {
            ws_id,
            ext: ext.to_string(),
            hash,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_file_new() {
        let file = ChatFile::new(1, "example.txt", b"hello world");
        assert_eq!(file.ext, "txt");
        assert_eq!(file.hash, hex::encode(Sha256::digest(b"hello world")));
        assert_eq!(file.ws_id, 1);
    }
}
