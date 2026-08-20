-- Foreign keys opcionais para o CyberCall
--
-- Por que NAO estao na migration automatica: adicionar uma constraint a uma
-- tabela que ja tem dados falha se existir qualquer linha orfa, e a falha
-- acontece no meio do deploy. Rode a verificacao abaixo antes de aplicar.
--
-- Os indices que estas constraints exigem ja foram criados pela migration
-- 0008_certain_polaris.sql, entao o ALTER TABLE nao precisa reconstruir a tabela.

-- =====================================================================
-- PASSO 1 - procurar orfaos. Todas as contagens precisam voltar 0.
-- =====================================================================

SELECT 'communities.ownerId' AS referencia, COUNT(*) AS orfaos
FROM communities c LEFT JOIN users u ON u.id = c.ownerId WHERE u.id IS NULL
UNION ALL SELECT 'communityMembers.communityId', COUNT(*)
FROM communityMembers m LEFT JOIN communities c ON c.id = m.communityId WHERE c.id IS NULL
UNION ALL SELECT 'communityMembers.userId', COUNT(*)
FROM communityMembers m LEFT JOIN users u ON u.id = m.userId WHERE u.id IS NULL
UNION ALL SELECT 'channels.communityId', COUNT(*)
FROM channels ch LEFT JOIN communities c ON c.id = ch.communityId WHERE c.id IS NULL
UNION ALL SELECT 'messages.channelId', COUNT(*)
FROM messages m LEFT JOIN channels ch ON ch.id = m.channelId WHERE ch.id IS NULL
UNION ALL SELECT 'messages.authorId', COUNT(*)
FROM messages m LEFT JOIN users u ON u.id = m.authorId WHERE u.id IS NULL
UNION ALL SELECT 'messageReactions.messageId', COUNT(*)
FROM messageReactions r LEFT JOIN messages m ON m.id = r.messageId WHERE m.id IS NULL
UNION ALL SELECT 'messageReactions.userId', COUNT(*)
FROM messageReactions r LEFT JOIN users u ON u.id = r.userId WHERE u.id IS NULL
UNION ALL SELECT 'directMessages.senderId', COUNT(*)
FROM directMessages d LEFT JOIN users u ON u.id = d.senderId WHERE u.id IS NULL
UNION ALL SELECT 'directMessages.recipientId', COUNT(*)
FROM directMessages d LEFT JOIN users u ON u.id = d.recipientId WHERE u.id IS NULL
UNION ALL SELECT 'attachments.ownerId', COUNT(*)
FROM attachments a LEFT JOIN users u ON u.id = a.ownerId WHERE u.id IS NULL
UNION ALL SELECT 'notifications.userId', COUNT(*)
FROM notifications n LEFT JOIN users u ON u.id = n.userId WHERE u.id IS NULL
UNION ALL SELECT 'roomInvites.communityId', COUNT(*)
FROM roomInvites i LEFT JOIN communities c ON c.id = i.communityId WHERE c.id IS NULL
UNION ALL SELECT 'roomInvites.senderId', COUNT(*)
FROM roomInvites i LEFT JOIN users u ON u.id = i.senderId WHERE u.id IS NULL
UNION ALL SELECT 'roomInvites.recipientId', COUNT(*)
FROM roomInvites i LEFT JOIN users u ON u.id = i.recipientId WHERE u.id IS NULL;

-- =====================================================================
-- PASSO 2 - aplicar somente se o passo 1 voltou tudo zerado.
-- =====================================================================

ALTER TABLE communities ADD CONSTRAINT fk_communities_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE communityMembers ADD CONSTRAINT fk_communityMembers_community FOREIGN KEY (communityId) REFERENCES communities(id) ON DELETE CASCADE;
ALTER TABLE communityMembers ADD CONSTRAINT fk_communityMembers_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE channels ADD CONSTRAINT fk_channels_community FOREIGN KEY (communityId) REFERENCES communities(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT fk_messages_channel FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT fk_messages_author FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messageReactions ADD CONSTRAINT fk_messageReactions_message FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE messageReactions ADD CONSTRAINT fk_messageReactions_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE directMessages ADD CONSTRAINT fk_directMessages_sender FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE directMessages ADD CONSTRAINT fk_directMessages_recipient FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE attachments ADD CONSTRAINT fk_attachments_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE roomInvites ADD CONSTRAINT fk_roomInvites_community FOREIGN KEY (communityId) REFERENCES communities(id) ON DELETE CASCADE;
ALTER TABLE roomInvites ADD CONSTRAINT fk_roomInvites_sender FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE roomInvites ADD CONSTRAINT fk_roomInvites_recipient FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE;

-- Depois de aplicar, tambem vale considerar as restricoes de unicidade abaixo.
-- Elas falham se ja existirem duplicatas, entao confira antes:
--   SELECT communityId, userId, COUNT(*) c FROM communityMembers GROUP BY 1,2 HAVING c > 1;
--   SELECT messageId, userId, emoji, COUNT(*) c FROM messageReactions GROUP BY 1,2,3 HAVING c > 1;
--
-- ALTER TABLE communityMembers ADD CONSTRAINT uq_communityMembers UNIQUE (communityId, userId);
-- ALTER TABLE messageReactions ADD CONSTRAINT uq_messageReactions UNIQUE (messageId, userId, emoji);
