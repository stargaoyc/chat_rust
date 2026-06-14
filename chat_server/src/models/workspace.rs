use sqlx::PgPool;

use crate::{
    AppError,
    models::{ChatUser, Workspace},
};

impl Workspace {
    pub async fn create(name: &str, user_id: u64, pool: &PgPool) -> Result<Self, AppError> {
        let workspace = sqlx::query_as(
            r#"
            INSERT INTO workspaces (name, owner_id)
            VALUES ($1, $2)
            RETURNING id, name, owner_id, created_at"#,
        )
        .bind(name)
        .bind(user_id as i64)
        .fetch_one(pool)
        .await?;

        Ok(workspace)
    }

    pub async fn update_owner(&self, owner_id: u64, pool: &PgPool) -> Result<Self, AppError> {
        // 更新工作区的拥有者，1）owner_id为0，表示工作区没有拥有者，可以被任何人认领；2）owner's ws_id必须与工作区的id相同，表示用户必须是工作区的成员才能认领
        let workspace = sqlx::query_as(
            r#"
            UPDATE workspaces
            SET owner_id = $1
            WHERE id = $2 and (SELECT ws_id FROM users WHERE id = $1) = $2
            RETURNING id, name, owner_id, created_at
            "#,
        )
        .bind(owner_id as i64)
        .bind(self.id)
        .fetch_one(pool)
        .await?;

        Ok(workspace)
    }

    pub async fn find_by_name(name: &str, pool: &PgPool) -> Result<Option<Self>, AppError> {
        let workspace =
            sqlx::query_as("SELECT id, name, owner_id, created_at FROM workspaces WHERE name = $1")
                .bind(name)
                .fetch_optional(pool)
                .await?;

        Ok(workspace)
    }

    pub async fn find_by_id(id: u64, pool: &PgPool) -> Result<Option<Self>, AppError> {
        let workspace =
            sqlx::query_as("SELECT id, name, owner_id, created_at FROM workspaces WHERE id = $1")
                .bind(id as i64)
                .fetch_optional(pool)
                .await?;

        Ok(workspace)
    }

    pub async fn fetch_all_chat_users(
        workspace_id: u64,
        pool: &PgPool,
    ) -> Result<Vec<ChatUser>, AppError> {
        let users = sqlx::query_as(
            r#"
            SELECT id, fullname, email
            FROM users
            WHERE ws_id = $1 order by id
            "#,
        )
        .bind(workspace_id as i64)
        .fetch_all(pool)
        .await?;

        Ok(users)
    }
}

#[cfg(test)]
mod tests {
    use crate::models::{CreateUser, User};

    use super::*;
    use anyhow::Result;

    #[sqlx::test(migrations = "../migrations")]
    async fn test_create_workspace(pool: PgPool) -> Result<()> {
        let workspace = Workspace::create("Test Workspace", 0, &pool).await?;
        assert_eq!(workspace.name, "Test Workspace");
        let input = CreateUser::new("test user", &workspace.name, "test@example.com", "123456");
        let user = User::create(&input, &pool).await?;
        assert_eq!(user.ws_id, workspace.id);

        let workspace = workspace.update_owner(user.id as u64, &pool).await?;
        assert_eq!(workspace.owner_id, user.id);

        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn test_find_workspace_by_name(pool: PgPool) -> Result<()> {
        let workspace = Workspace::find_by_name("Test Workspace", &pool).await?;
        assert!(workspace.is_none());

        let workspace = Workspace::find_by_name("Workspace 1", &pool).await?;
        assert_eq!(workspace.unwrap().name, "Workspace 1");
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn test_fetch_all_chat_users(pool: PgPool) -> Result<()> {
        let users = Workspace::fetch_all_chat_users(1, &pool).await?;
        assert_eq!(users.len(), 5);
        Ok(())
    }
}
