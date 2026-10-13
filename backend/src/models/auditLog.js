'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      actorUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'actor_user_id',
      },
      actorRole: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'actor_role',
      },
      action: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING(60),
        allowNull: true,
        field: 'entity_type',
      },
      entityId: {
        type: DataTypes.STRING(60),
        allowNull: true,
        field: 'entity_id',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'user_agent',
      },
    },
    {
      tableName: 'audit_logs',
      underscored: true,
      updatedAt: false,
      indexes: [
        { fields: ['actor_user_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return AuditLog;
};
