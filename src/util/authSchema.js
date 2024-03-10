import zod from "zod";

const userAdd_Auth = (Username, Name, Password, Gender, Email, PhoneNum, Hostel, UID) => {
    const name = zod.string().min(1);
    const password = zod.string().min(8);
    const username = zod.string().min(5);
    const gender = zod.enum(["MALE","FEMALE","OTHER","RATHER NOT SAY"]);
    
    const email = zod.string().email().refine((val) => val.endsWith("@cuchd.in"));

    
    const phoneNumber = zod.string().max(10);
    const hostel = zod.enum(["NekChand/Zakir", "SUKHNA", "TAGORE"]);
    const uid = zod.string();





    return { 
        data: `${[
            "Name -> " + " " + name.safeParse(Name).success ,
            "Password ->" + " " + password.safeParse(Password).success ,
            "Username ->" + " " + username.safeParse(Username).success ,
            "Gender ->" + " " + gender.safeParse(Gender).success ,
            "Email ->" + " " + email.safeParse(Email).success ,
            "Phone Number ->" + " " + phoneNumber.safeParse(PhoneNum).success ,
            "Hostel ->" + " " + hostel.safeParse(Hostel).success ,
            "UID ->" + " " + uid.safeParse(UID).success
        ]}`
    ,
        "success" : name.safeParse(Name).success && password.safeParse(Password).success && username.safeParse(Username).success && gender.safeParse(Gender).success 
        && email.safeParse(Email).success && phoneNumber.safeParse(PhoneNum).success && hostel.safeParse(Hostel).success && uid.safeParse(UID).success
    
    };

}

const userLogin_Auth = (Username_Email, Password) => {
    const password = zod.string().min(8);
    const username = zod.string().min(5);

    const email = zod.string().email().refine((val) => val.endsWith("@cuchd.in"));

    const passParse = password.safeParse(Password).success;
    const userParse = username.safeParse(Username_Email).success;
    const emailParse = email.safeParse(Username_Email).success;

    return { 
        data: `${[
            "Password ->" + " " +  passParse,
            "Username ->" + " " +  userParse,
            "Email ->" + " " +  emailParse,
        ]}`
    ,
        "success" : (emailParse || userParse) && passParse
    
    };
}


export {
    userAdd_Auth,
    userLogin_Auth
}