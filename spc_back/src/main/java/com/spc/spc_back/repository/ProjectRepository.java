package com.spc.spc_back.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.spc.spc_back.entity.spcdata.Project;
import com.spc.spc_back.mapper.ProjectMapper;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ProjectRepository {
    private final ProjectMapper projectMapper;

    public int insertProject(Project project) {
        return projectMapper.insertProject(project);
    }

    public Optional<Project> selectProjectByProjId(Long projId) {
        return Optional.ofNullable(projectMapper.selectProjectByProjId(projId));
    }

    public Optional<List<Project>> selectProjectListByKeyword(String keyword) {
        return Optional.ofNullable(projectMapper.selectProjectListByKeyword(keyword));
    }

    public Optional<List<Project>> selectProjectList() {
        return Optional.ofNullable(projectMapper.selectProjectList());
    }

    public int updateProject(Project project) {
        return projectMapper.updateProject(project);
    }

    public int deleteProject(Long projId) {
        return projectMapper.deleteProject(projId);
    }
}
