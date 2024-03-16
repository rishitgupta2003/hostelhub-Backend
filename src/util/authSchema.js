import zod from "zod";

const userAdd_Auth = (Username, Name, Password, Gender, Email, PhoneNum, Hostel, UID) => {
    const name = zod.string().min(1);
    const password = zod.string().min(8);
    const username = zod.string().min(5);
    const gender = zod.enum(["MALE","FEMALE","OTHER","RATHER NOT SAY"]);
    
    const email = zod.string().email().refine((val) => val.endsWith('@cuchd.in') || val.endsWith('@cumail.in'));

    
    const phoneNumber = zod.string().max(10);
    const hostel = zod.enum(["NekChand/Zakir", "SUKHNA", "TAGORE"]);
    const uid = zod.string();

    const nameParse = name.safeParse(Name).success;
    const passParse = password.safeParse(Password).success;
    const userParse = username.safeParse(Username).success;
    const genderParse = gender.safeParse(Gender).success;
    const emailParse = email.safeParse(Email).success;
    const phoneNumParse = phoneNumber.safeParse(PhoneNum).success;
    const hostelParse = hostel.safeParse(Hostel).success;
    const uidParse = uid.safeParse(UID).success;

    return { 
        data: `${[
            "Name -> " + nameParse,
            "Password -> " +  passParse,
            "Username -> " +  userParse,
            "Gender -> " +  genderParse,
            "Email -> " +  emailParse,
            "Phone Number -> " +  phoneNumParse,
            "Hostel -> " +  hostelParse,
            "UID -> " + uidParse
        ]}`
    ,
        "success" : nameParse && passParse && userParse && genderParse && emailParse && phoneNumParse && hostelParse && uidParse
    
    };

}

const userLogin_Auth = (Username_Email, Password) => {
    const password = zod.string().min(8);
    const username = zod.string().min(5);

    const email = zod.string().email().refine((val) => val.endsWith('@cuchd.in') || val.endsWith('@cumail.in'));

    const passParse = password.safeParse(Password).success;
    const userParse = username.safeParse(Username_Email).success;
    const emailParse = email.safeParse(Username_Email).success;

    return { 
        data: `${[
            "Password -> " +  passParse,
            "Username -> " +  userParse,
            "Email -> " + emailParse,
        ]}`
    ,
        "success" : (emailParse || userParse) && passParse
    
    };
}


const productAuth = (Product, Description, Price) => {
    
    const product = zod.string().min(10);
    const description = zod.string().max(300);
    const price = zod.number();

    const productParse = product.safeParse(Product);
    const descParse = description.safeParse(Description);
    const priceParse = price.safeParse(Price);

    return {
        data : `${
            [
                "Product -> " + productParse,
                "Desc -> " + descParse,
                "Price -> " + priceParse
            ]
        }`
        ,
        "success": productParse && descParse && priceParse
    }
}

export {
    userAdd_Auth,
    userLogin_Auth,
    productAuth
}