import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-muted-foreground">👤</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to manage your anime lists and watch history.
        </p>
      </div>
    </div>
  );
}
