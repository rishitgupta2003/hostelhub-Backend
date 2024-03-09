import zod from "zod";

const userAdd_Auth = (Username, Name, Password, Gender, Email, PhoneNum, Hostel, UID) => {
    const name = zod.string().min(1);
    const password = zod.string().min(8);
    const username = zod.string().min(5);
    const gender = zod.enum(["MALE","FEMALE","OTHER","RATHER NOT SAY"]);
    const email = zod.string().email().refine(
        (val) => {
            val.endsWith("@cuchd.in")
        },
        {
            "message" : "INVALID FORMAT"
        }
    );
    const phoneNumber = zod.number().min(10);
    const hostel = zod.enum(["NekChand/Zakir", "SUKHNA", "TAGORE"]);
    const uid = zod.string().max(10).min(9);

    return name.safeParse(Name).success && password.safeParse(Password).success && username.safeParse(Username).success && gender.safeParse(Gender).success 
        && email.safeParse(Email).success && phoneNumber.safeParse(PhoneNum).success && hostel.safeParse(Hostel).success && uid.safeParse(UID).success;

}


export default userAdd_Auth;