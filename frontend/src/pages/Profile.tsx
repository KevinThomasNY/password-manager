import ProfileInformation from "@/components/ProfileInformation";
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
      <div className="grid grid-cols-2 gap-6">
        <div>
          <ProfileInformation profileQuery={profileQuery} />
        </div>
        <div>box 2</div>
        <div className="md:col-span-2">box 3</div>
      </div>
    </div>
  );
};

export default Profile;
