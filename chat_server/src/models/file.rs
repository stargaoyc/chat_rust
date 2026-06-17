use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

use crate::ChatFile;

impl ChatFile {
    pub fn new(filename: &str, data: &[u8]) -> Self {
        let hash = Sha256::digest(data);
        let ext = Path::new(filename)
            .extension() // 获取最后一个扩展名
            .and_then(|os| os.to_str()) // 转为 &str
            .filter(|s| !s.is_empty())
            .unwrap_or("bin") // 若没有，默认 "bin"（不建议默认为 txt）
            .to_string();
        Self {
            ext,
            hash: hex::encode(hash),
        }
    }

    pub fn url(&self, ws_id: u64) -> String {
        format!("/files/{}/{}", ws_id, self.hash_to_path())
    }

    pub fn path(&self, base_dir: &Path) -> PathBuf {
        base_dir.join(self.hash_to_path())
    }

    pub fn hash_to_path(&self) -> String {
        let (part1, part2) = self.hash.split_at(3);
        let (part2, part3) = part2.split_at(3);
        format!("{}/{}/{}.{}", part1, part2, part3, self.ext)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_file_new() {
        let file = ChatFile::new("example.txt", b"hello world");
        assert_eq!(file.ext, "txt");
        assert_eq!(file.hash, hex::encode(Sha256::digest(b"hello world")));
    }
}
