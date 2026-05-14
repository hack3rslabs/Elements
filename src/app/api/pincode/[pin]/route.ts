import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ pin: string }> }
) {
    try {
        const { pin } = await params;

        if (!pin || pin.length !== 6) {
            return NextResponse.json({ success: false, message: "Invalid PIN code" }, { status: 400 });
        }

        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await response.json();

        if (data && data[0] && data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            return NextResponse.json({
                success: true,
                data: {
                    area: postOffice.Name,
                    city: postOffice.District,
                    state: postOffice.State
                }
            });
        }

        return NextResponse.json({ success: false, message: "PIN code not found" }, { status: 404 });
    } catch (error) {
        console.error("Pincode lookup error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
