# Granular Permission System Documentation

## Overview

The granular permission system provides fine-grained access control for battle rooms, allowing hosts to manage participant permissions and control access to different features within the collaborative coding environment.

## Permission Levels

### 1. View Only (`view-only`)
- **Access**: Read-only access to battle content
- **Capabilities**:
  - View the battle problem and description
  - See other participants' submissions and scores
  - View the leaderboard
  - Access chat (if enabled)
- **Restrictions**:
  - Cannot write or edit code
  - Cannot run tests
  - Cannot submit solutions
  - Cannot modify room settings

### 2. Edit Code (`edit-code`)
- **Access**: Full coding capabilities
- **Capabilities**:
  - All view-only permissions
  - Write and edit code in the editor
  - Run tests against their code
  - Submit solutions
  - View test results and feedback
- **Restrictions**:
  - Cannot modify room settings
  - Cannot change other participants' permissions

### 3. Full Access (`full-access`)
- **Access**: Complete room management capabilities
- **Capabilities**:
  - All edit-code permissions
  - Modify room settings
  - Change default permissions for new participants
  - Change individual participant permissions (if allowed)
  - Toggle permission change settings
- **Restrictions**:
  - Cannot change host permissions
  - Cannot remove the host role

## Implementation Details

### Database Schema Changes

#### Room Model Extensions
```javascript
// Added to participants array
permissions: {
  type: String,
  enum: ['view-only', 'edit-code', 'full-access'],
  default: 'edit-code'
}

// Added to settings
defaultPermissions: {
  type: String,
  enum: ['view-only', 'edit-code', 'full-access'],
  default: 'edit-code'
},
allowPermissionChanges: {
  type: Boolean,
  default: true
}
```

### API Endpoints

#### Get Room Permissions
```
GET /api/battle/:roomId/permissions
```
Returns current permission settings and participant permissions.

#### Update Default Permissions
```
PATCH /api/battle/:roomId/permissions/default
```
Updates the default permissions for new participants (host only).

#### Update Individual Permissions
```
PATCH /api/battle/:roomId/permissions/:userId
```
Updates permissions for a specific participant (host only).

#### Update Permission Settings
```
PATCH /api/battle/:roomId/permissions/settings
```
Toggles whether permission changes are allowed (host only).

### Socket Events

#### Client to Server Events
- `change-permission`: Change individual participant permissions
- `change-default-permissions`: Change default permissions for new participants
- `change-permission-settings`: Toggle permission change settings

#### Server to Client Events
- `permission-changed`: Broadcast when a participant's permissions change
- `default-permissions-changed`: Broadcast when default permissions change
- `permission-settings-changed`: Broadcast when permission settings change

### Middleware

#### Permission Validation Middleware
```javascript
const validatePermission = (requiredPermission) => {
  return async (req, res, next) => {
    // Validates user has required permission level
    // Adds permission info to request object
  };
};
```

Applied to:
- Code testing endpoints (`/test`)
- Code submission endpoints (`/submit`)

## Usage Examples

### 1. Setting Up Permissions in BattleConfigModal

```typescript
// In BattleConfigModal.tsx
const [config, setConfig] = useState({
  // ... other config
  defaultPermissions: 'edit-code',
  allowPermissionChanges: true
});

// Permission configuration UI
<div className="permission-options">
  <label className="option-card">
    <input
      type="radio"
      value="view-only"
      checked={config.defaultPermissions === 'view-only'}
      onChange={(e) => updateConfig({ defaultPermissions: e.target.value })}
    />
    <div className="option-content">
      <div className="option-icon">👁️</div>
      <div>
        <div className="option-title">View Only</div>
        <div className="option-desc">Can only view the battle, no code editing</div>
      </div>
    </div>
  </label>
  {/* ... other options */}
</div>
```

### 2. Using PermissionManager Component

```typescript
import PermissionManager from './components/Battle/PermissionManager';

// In your battle room component
<PermissionManager
  roomId={roomId}
  isHost={isHost}
  onPermissionChange={(participantId, newPermissions) => {
    console.log(`Permission changed for ${participantId}: ${newPermissions}`);
  }}
/>
```

### 3. Checking Permissions in Components

```typescript
// Check if user can edit code
const canEditCode = userPermission === 'edit-code' || userPermission === 'full-access';

// Check if user can manage room
const canManageRoom = userPermission === 'full-access' && isHost;

// Conditional rendering
{canEditCode && (
  <CodeEditor />
)}

{canManageRoom && (
  <RoomSettings />
)}
```

### 4. Server-side Permission Validation

```javascript
// In route handlers
router.post('/:roomId/submit', 
  optionalAuth, 
  validatePermission('edit-code'), 
  async (req, res) => {
    // User is guaranteed to have edit-code permission or higher
    // req.userPermission contains user's permission level
    // req.isHost indicates if user is host
  }
);
```

## Security Considerations

### 1. Permission Hierarchy
- Permissions follow a hierarchical structure
- Higher permissions include all lower permission capabilities
- Hosts always have full access regardless of permission level

### 2. Validation
- All permission changes are validated server-side
- Only hosts can change permissions
- Host permissions cannot be modified
- Anonymous users default to view-only access

### 3. Real-time Updates
- Permission changes are broadcast to all room participants
- Clients receive immediate updates when permissions change
- UI automatically updates to reflect new permission levels

## Migration Guide

### For Existing Rooms
- Existing participants will have `edit-code` permissions by default
- Default permissions for new participants will be `edit-code`
- Permission changes will be enabled by default

### For New Rooms
- Use the BattleConfigModal to set initial permission preferences
- Configure default permissions and permission change settings
- Participants will receive the configured default permissions when joining

## Best Practices

### 1. Permission Design
- Start with `edit-code` as default for most use cases
- Use `view-only` for observers or students who should only watch
- Reserve `full-access` for co-hosts or teaching assistants

### 2. User Experience
- Clearly communicate permission levels to users
- Provide visual indicators for current permission level
- Allow hosts to easily change permissions during the battle

### 3. Error Handling
- Gracefully handle permission denied errors
- Provide clear feedback when actions are restricted
- Offer guidance on how to request permission changes

## Troubleshooting

### Common Issues

1. **Permission changes not taking effect**
   - Check if `allowPermissionChanges` is enabled
   - Verify the user is a host
   - Ensure the target participant exists and is active

2. **Users can't submit code**
   - Verify they have `edit-code` or `full-access` permissions
   - Check if the battle is active
   - Ensure they are a participant in the room

3. **Socket events not working**
   - Verify socket connection is established
   - Check authentication token is valid
   - Ensure user is joined to the room

### Debug Information

Enable debug logging to see permission validation:
```javascript
console.log('User permission:', req.userPermission);
console.log('Is host:', req.isHost);
console.log('Required permission:', requiredPermission);
```

## Future Enhancements

### Planned Features
1. **Role-based permissions**: Custom permission sets for different roles
2. **Time-based permissions**: Temporary permission changes
3. **Permission templates**: Predefined permission configurations
4. **Audit logging**: Track all permission changes
5. **Bulk permission changes**: Change multiple participants at once

### Integration Opportunities
1. **Team management**: Integrate with team-based permissions
2. **Course management**: Link permissions to course enrollment
3. **Assessment tools**: Use permissions for exam mode
4. **Analytics**: Track permission usage patterns
