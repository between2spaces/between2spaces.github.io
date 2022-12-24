const isEmailRE = /^([A-Za-z0-9_\-.+])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,})$/

const isEmail = email => {
    return isEmailRE.test( email )
}

const isPasswordRE = /^([A-Za-z0-9_\-.+@]){8,}$/

const isPassword = password => {
    return isPasswordRE.test( password )
}

const isCharacterNameRE = /^([A-Za-z0-9]){5,}$/

const isCharacterName = name => {
    return isCharacterNameRE.test( name )
}

export { isEmail, isPassword, isCharacterName }
