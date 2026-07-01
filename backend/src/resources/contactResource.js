function contactResource(contact) {
  return {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    subject: contact.subject,
    message: contact.message,
    status: contact.status,
    read_at: contact.read_at,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
  };
}

module.exports = contactResource;