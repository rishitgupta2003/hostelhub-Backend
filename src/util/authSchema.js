import zod, { object } from "zod";

const userAuth = (Username, Name, Password, Gender, Email, PhoneNum, Hostel) => {
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

    return name.safeParse(Name).success && password.safeParse(Password).success && username.safeParse(Username).success && gender.safeParse(Gender).success 
        && email.safeParse(Email).success && phoneNumber.safeParse(PhoneNum).success && hostel.safeParse(Hostel).success;

}