export const ROLES=[
    "SUPER_ADMIN",
    "CLIENT_ADMIN",
    "CLIENT_VIEWER"
]


export const CLIENT_ROLES=[
    "CLIENT_ADMIN",
    "CLIENT_VIEWER"
]
export const APPLICATION_ROLES={
    SUPER_ADMIN:"SUPER_ADMIN",
    CLIENT_ADMIN:"CLIENT_ADMIN",
    CLIENT_VIEWER:"CLIENT_VIEWER"
}

export const isValidClientRole=(role)=>CLIENT_ROLES.includes(role);

export const isValidRole=(role)=>ROLES.includes(role);