package com.example.projectmanager.service;

import com.example.projectmanager.dto.DashboardResponse;
import com.example.projectmanager.model.Task;
import com.example.projectmanager.model.TaskStatus;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.TaskRepository;
import com.example.projectmanager.repository.UserRepository;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public DashboardService(
            ProjectService projectService,
            TaskRepository taskRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService
    ) {
        this.projectService = projectService;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    public DashboardResponse summary() {
        User user = currentUserService.get();
        var projects = projectService.permittedProjects();
        List<Task> tasks = currentUserService.isAdmin(user)
                ? taskRepository.findAll()
                : taskRepository.findByAssignee(user);

        Map<TaskStatus, Long> counts = tasks.stream()
                .collect(Collectors.groupingBy(Task::getStatus, () -> new EnumMap<>(TaskStatus.class), Collectors.counting()));
        Map<String, Long> byStatus = Map.of(
                "TODO", counts.getOrDefault(TaskStatus.TODO, 0L),
                "IN_PROGRESS", counts.getOrDefault(TaskStatus.IN_PROGRESS, 0L),
                "DONE", counts.getOrDefault(TaskStatus.DONE, 0L)
        );
        long members = currentUserService.isAdmin(user) ? userRepository.count() : 1L;
        return new DashboardResponse(projects.size(), tasks.size(), members, byStatus);
    }
}
