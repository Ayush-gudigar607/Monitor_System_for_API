class ResponceFormatter{
    static sucess(data,message="success",statusCode=200)
    {
        return {
            success:true,
            message,
            data,
            statusCode,
            timeStamp:new Date().toISOString()
        }
    }

    static error(message="error",statusCode=500,error=null)
    {
        return {
            success:false,
            message,
            error,
            statusCode,
            timeStamp:new Date().toISOString()
        }
    }

    static validationError(statusCode=400,error=null)
    {
        return{
            success:false,
            message:"validation error",
            error,
            statusCode,
            timeStamp:new Date().toISOString()
        }
    }

    static paginated(data=null,page,limit,total)
    {
        return{
            sucess:true,
            data,
            pagination:{
                page,
                limit,
                total,
                totalPages:Math.ceil(total/limit)
            },
            timeStamp:new Date().toISOString()
        }
    }
}


export default ResponceFormatter;