const asyncHandler = (requestHandler) => async (req, res, next) => {
    try{
        return await requestHandler(req, res, next);
    }catch(err){
        res.status(err.status || 500).json({
            success: false,
            message: err.message
        });
    }
};

export { asyncHandler };