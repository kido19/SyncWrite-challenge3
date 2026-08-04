export const getUserRole = (document, userId) => {
  if (document.owner.toString() === userId.toString()) return 'owner';

  const collaborator = document.collaborators.find(
    (c) => c.user.toString() === userId.toString()
  );
  return collaborator ? collaborator.role : null;
};