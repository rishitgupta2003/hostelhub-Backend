import {Schema, model} from "mongoose";

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        coverImg: {
            type: String, //coverImg_link
            required: true
        },
        productImgs: {
            type: [
                String // ArrayOfLinks
            ],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            default: 0
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isSold: {
            type: Boolean,
            required: true,
            default: false
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: false,
        }
    },
    {
        timstamps: true
    }
)

export const Product = model("Products", productSchema);