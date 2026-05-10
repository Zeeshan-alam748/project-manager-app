package com.example.projectmanager.service;

import com.example.projectmanager.dto.TaskDto;
import com.example.projectmanager.dto.TaskRequest;
import com.example.projectmanager.exception.ApiException;
import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.Task;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.TaskRepository;
import com.example.projectmanager.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final CurrentUserService currentUserService;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            ProjectService projectService,
            CurrentUserService currentUserService
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.currentUserService = currentUserService;
    }

    public List<TaskDto> list() {
        User user = currentUserService.get();
        if (currentUserService.isAdmin(user)) {
            return taskRepository.findAll().stream().map(TaskDto::from).toList();
        }
        return taskRepository.findByProjectIn(projectService.permittedProjects()).stream().map(TaskDto::from).toList();
    }

    @Transactional
    public TaskDto create(TaskRequest request) {
        Project project = projectService.requireManageAccess(request.projectId());
        Task task = new Task();
        apply(task, request, project);
        return TaskDto.from(taskRepository.save(task));
    }

    @Transactional
    public TaskDto update(Long id, TaskRequest request) {
        Task task = requireTaskAccess(id);
        Project project = projectService.requireAccess(request.projectId());
        User user = currentUserService.get();
        boolean canManage = currentUserService.isAdmin(user) || task.getProject().getOwner().getId().equals(user.getId());
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(user.getId());
        if (!canManage && !isAssignee) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only update tasks assigned to you");
        }
        apply(task, request, project);
        return TaskDto.from(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        Task task = requireTaskAccess(id);
        User user = currentUserService.get();
        if (!currentUserService.isAdmin(user) && !task.getProject().getOwner().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only admins and project owners can delete tasks");
        }
        taskRepository.delete(task);
    }

    private Task requireTaskAccess(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        projectService.requireAccess(task.getProject().getId());
        return task;
    }

    private void apply(Task task, TaskRequest request, Project project) {
        task.setTitle(request.title());
        task.setDetails(request.details());
        task.setStatus(request.status());
        task.setDueDate(request.dueDate());
        task.setProject(project);
        task.setAssignee(request.assigneeId() == null ? null : userRepository.findById(request.assigneeId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Assignee not found")));
    }
}

