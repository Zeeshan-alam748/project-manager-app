package com.example.projectmanager.repository;

import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.Task;
import com.example.projectmanager.model.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIn(List<Project> projects);

    List<Task> findByAssignee(User assignee);

    void deleteByProject(Project project);
}
