// Returns which placeholder state HeroPhoto should render.
// A — unclaimed field, viewer is not an owner/admin → "Is this your field?"
// B — unclaimed field, viewer IS an owner or admin → "Claim this listing"
// C — claimed field (owner exists), no photo yet → "Photo coming soon"
// D — no field context (fallback) → shield only
export function getHeroState(field, currentUser) {
  if (!field) return 'D'
  if (field.owner_id) return 'C'
  const isOwnerViewer = currentUser?.role === 'owner' || currentUser?.role === 'admin'
  return isOwnerViewer ? 'B' : 'A'
}
