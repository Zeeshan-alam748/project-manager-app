package com.example.projectmanager.service;

import com.example.projectmanager.dto.ProjectDto;
import com.example.projectmanager.dto.ProjectRequest;
import com.example.projectmanager.exception.ApiException;
import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.ProjectRepository;
import com.example.projectmanager.repository.TaskRepository;
import com.example.projectmanager.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final CurrentUserService currentUserService;

    public ProjectService(
            ProjectRepository projectRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            CurrentUserService currentUserService
    ) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.currentUserService = currentUserService;
    }

    public List<Project> permittedProjects() {
        User user = currentUserService.get();
        if (currentUserService.isAdmin(user)) {
            return projectRepository.findAll();
        }
        return projectRepository.findByOwnerOrMembersContaining(user, user);
    }

    public List<ProjectDto> list() {
        return permittedProjects().stream().map(ProjectDto::from).toList();
    }

    public ProjectDto get(Long id) {
        return ProjectDto.from(requireAccess(id));
    }

    @Transactional
    public ProjectDto create(ProjectRequest request) {
        User user = currentUserService.get();
        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setDueDate(request.dueDate());
        project.setOwner(user);
        project.setMembers(loadMembers(request.memberIds()));
        return ProjectDto.from(projectRepository.save(project));
    }

    @Transactional
    public ProjectDto update(Long id, ProjectRequest request) {
        Project project = requireManageAccess(id);
        project.setName(request.name());
        project.setDescription(request.description());
        project.setDueDate(request.dueDate());
        project.setMembers(loadMembers(request.memberIds()));
        return ProjectDto.from(projectRepository.save(project));
    }

    @Transactional
    public void delete(Long id) {
        Project project = requireManageAccess(id);
        taskRepository.deleteAll(taskRepository.findByProjectIn(List.of(project)));
        projectRepository.delete(project);
    }

    public Project requireAccess(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
        User user = currentUserService.get();
        boolean permitted = currentUserService.isAdmin(user)
                || project.getOwner().getId().equals(user.getId())
                || project.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId()));
        if (!permitted) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this project");
        }
        return project;
    }

    public Project requireManageAccess(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
        User user = currentUserService.get();
        if (!currentUserService.isAdmin(user) && !project.getOwner().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only admins and project owners can change this project");
        }
        return project;
    }

    private Set<User> loadMembers(Set<Long> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return new LinkedHashSet<>();
        }
        return new LinkedHashSet<>(userRepository.findAllById(memberIds));
    }
}

