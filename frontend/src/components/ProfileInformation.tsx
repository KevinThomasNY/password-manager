import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getLoginHistory,
  ProfileInformation as ProfileInfoType,
} from "@/api/user-api";
import moment from "moment";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { History } from "lucide-react";

interface ProfileInformationProps {
  profileQuery: UseQueryResult<ProfileInfoType>;
}

const ProfileInformation = ({ profileQuery }: ProfileInformationProps) => {
  const {
    data: profileData,
    isLoading: profileIsLoading,
    isError: profileIsError,
  } = profileQuery;

  const [limit, setLimit] = useState<number>(1);
  const [open, setOpen] = useState<boolean>(false);

  const loginHistory = useQuery({
    queryKey: ["loginHistory", limit],
    queryFn: () => getLoginHistory(limit),
  });

  const {
    data: loginData,
    isLoading: loginIsLoading,
    isError: loginIsError,
  } = loginHistory;

  if (profileIsLoading || loginIsLoading) {
    return <div>Loading...</div>;
  }
  if (profileIsError || loginIsError) {
    return <div>Error loading profile information</div>;
  }

  const lastLoginEastern = loginData?.[0]?.loginTime
    ? moment
        .utc(loginData[0].loginTime)
        .tz("America/New_York")
        .format("MM/DD/YYYY h:mm A")
    : "N/A";

  const handleViewLogs = () => {
    setLimit(5);
    setOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your current profile details and last login
          </CardDescription>
          <CardContent className="pt-2 space-y-4">
            <div>
              <strong>Name:</strong> {profileData?.firstName}{" "}
              {profileData?.lastName}
            </div>
            <div>
              <strong>Username:</strong> {profileData?.userName}
            </div>
            <div>
              <strong>Last Login:</strong> {lastLoginEastern}
            </div>
            <Button variant="outline" onClick={handleViewLogs}>
              View Logs
            </Button>
          </CardContent>
        </CardHeader>
      </Card>

      {/* ShadCN Dialog component */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <div className="flex items-center">
              <History className="w-6 h-6 mr-2 text-gray-600" />
              <DialogTitle className="text-2xl font-bold">
                Login History
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-sm text-gray-600">
              Your last 5 login times
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {loginData?.map((record, index) => {
              const date = moment
                .utc(record.loginTime)
                .tz("America/New_York")
                .format("M/DD/YYYY");
              const time = moment
                .utc(record.loginTime)
                .tz("America/New_York")
                .format("h:mm A");
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded shadow-sm"
                >
                  <span className="font-semibold text-gray-800">{date}</span>
                  <span className="text-gray-600">{time}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileInformation;
