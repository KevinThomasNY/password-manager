import ProfileInformation from "@/components/ProfileInformation";
import UpdateProfile from "@/components/UpdateProfile";
import UpdatePassword from "@/components/UpdatePassword";

import { useQuery } from "@tanstack/react-query";
import { getProfileInformation } from "@/api/user-api";

const Profile = () => {
  const profileQuery = useQuery({
    queryKey: ["profileInformation"],
    queryFn: getProfileInformation,
  });

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <ProfileInformation profileQuery={profileQuery} />
        <UpdateProfile profileQuery={profileQuery} />
        <div className="md:col-span-2">
          <UpdatePassword />
        </div>
      </div>
    </div>
  );
};

export default Profile;
