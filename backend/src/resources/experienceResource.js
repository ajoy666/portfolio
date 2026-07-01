function experienceResource(exp) {
  if (!exp) return null;

  return {
    id: exp.id,
    company: exp.company,
    role: exp.role,
    type: exp.type,
    location: exp.location,
    start_date: exp.start_date,
    end_date: exp.end_date,
    description: exp.description,
    is_active: exp.is_active,
    order: exp.order,
    created_at: exp.created_at,
    updated_at: exp.updated_at,
  };
}

module.exports = experienceResource;
