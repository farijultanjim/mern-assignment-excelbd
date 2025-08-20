import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/admin/:path*",
    "/dashboard/agent/:path*",
    "/dashboard/customer/:path*",
    "/parcels/:path*",
  ],
};
