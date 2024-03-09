import { User } from "../models/user.models.js";
import { asyncHandler } from "../util/asyncHandler.js";
import userAdd_Auth from "../util/authSchema.js";

const registerUser = asyncHandler(
    async (req, res) => {
        //get user details
        //validations
        //check if already exists
        //check for imgs
        //upload to cloudinary
        //create user object -> add to db
        //remove refresh and access token from field
        //check for user creation
        //return response

        const {username, name, email, password, uid, gender, phoneNum, hostel_name} = req.body;
        const isValidated = userAdd_Auth(username, name, password, gender, email, phoneNum, hostel_name, uid);
    
        if(!isValidated){
            return res.status(400).json({
                "msg" : "INVALID FORMATS"
            });
        }

        const doExist = User.findOne({email: email});

        if(doExist){
            return res.status(500).json({
                "msg" : "User Already Exists"
            });
        }

        res.json(
            {
                name: name,
                username: username,
                email: email
            }
        );
    }
)

export { registerUser }